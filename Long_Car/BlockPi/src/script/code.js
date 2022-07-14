/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Blockly's Code.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

// QT交互
new QWebChannel(qt.webChannelTransport, function(channel) {
  window.bridgeJS = channel.objects.bridge;  //bridge 与QT 中一致
  });

/**
 * Create a namespace for the application.
 */
var Code = {};

/**
 * Create a namespace for the child process.
 */
var child = null;

/**
 * Lookup for names of supported languages.  Keys should be in ISO 639 format.
 */
Code.LANGUAGE_NAME = {
  'en': 'English',
  'zh-hans': '简体中文',
  'zh-hant': '正體中文'
};


/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

/**
 * Extracts a parameter from the URL.
 * If the parameter is absent default_value is returned.
 * @param {string} name The name of the parameter.
 * @param {string} defaultValue Value to return if parameter not found.
 * @return {string} The parameter value or the default value if not found.
 */
Code.getStringParamFromUrl = function (name, defaultValue) {
  var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
  return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Get the language of this user from the URL.
 * @return {string} User's language.
 */
Code.getLang = function () {
  var lang = Code.getStringParamFromUrl('lang', '');
  if (Code.LANGUAGE_NAME[lang] === undefined) {
    // Default to simple Chinese.
      lang = 'zh-hans';
  }
  return lang;
};

/**
 * Load blocks saved in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
Code.loadBlocks = function (defaultXml) {
  try {
    var loadOnce = window.sessionStorage.loadOnceBlocks;
  } catch (e) {
    // Firefox sometimes throws a SecurityError when accessing sessionStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
    var loadOnce = null;
  }
  if ('BlocklyStorage' in window) {
    // Restore saved blocks in a separate thread so that subsequent
    // initialization is not affected from a failed load.
    window.setTimeout(BlocklyStorage.restoreBlocks, 1);
  } else if (loadOnce) {
    // Language switching stores the blocks during the reload.
    delete window.sessionStorage.loadOnceBlocks;
    var xml = Blockly.Xml.textToDom(loadOnce);
    Blockly.Xml.domToWorkspace(xml, Code.workspace);
  } else if (defaultXml) {
    // Load the editor with default starting blocks.
    var xml = Blockly.Xml.textToDom(defaultXml);
    Blockly.Xml.domToWorkspace(xml, Code.workspace);
  }
};



/**
 * Save the blocks and reload with a different language.
 */
Code.changeLanguage = function () {
  // Store the blocks for the duration of the reload.
  // MSIE 11 does not support sessionStorage on file:// URLs.
  if (child !== null) {
    child.kill();
  }

  if (window.sessionStorage) {
    var xml = Blockly.Xml.workspaceToDom(Code.workspace);
    var text = Blockly.Xml.domToText(xml);
    window.sessionStorage.loadOnceBlocks = text;
  }

  var languageMenu = document.getElementById('languageMenu');
  var newLang = encodeURIComponent(
    languageMenu.options[languageMenu.selectedIndex].value);
  var search = window.location.search;
  if (search.length <= 1) {
    search = '?lang=' + newLang;
  } else if (search.match(/[?&]lang=[^&]*/)) {
    search = search.replace(/([?&]lang=)[^&]*/, '$1' + newLang);
  } else {
    search = search.replace(/\?/, '?lang=' + newLang + '&');
  }

  window.location = window.location.protocol + '//' +
    window.location.host + window.location.pathname + search;
};

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Code.bindClick = function (el, func) {
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Load the Prettify CSS and JavaScript.
 */
Code.importPrettify = function () {
  var script = document.createElement('script');
  script.setAttribute('src', 'src/script/run_prettify.js');
  document.head.appendChild(script);
};

/**
 * Compute the absolute coordinates and dimensions of an HTML element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Code.getBBox_ = function (element) {
  var height = element.offsetHeight;
  var width = element.offsetWidth;
  var x = 0;
  var y = 0;
  do {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  } while (element);
  return {
    height: height,
    width: width,
    x: x,
    y: y
  };
};

/**
 * User's language (e.g. "en").
 * @type {string}
 */
Code.LANG = Code.getLang();

/**
 * List of tab names.
 * @private
 */
Code.TABS_ = ['blocks', 'python'];

Code.selected = 'blocks';

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
Code.tabClick = function (clickedName) {
  if (document.getElementById('tab_blocks').className == 'tabon') {
    Code.workspace.setVisible(false);
  }
  // Deselect all tabs and hide all panes.
  for (var i = 0; i < Code.TABS_.length; i++) {
    var name = Code.TABS_[i];
    document.getElementById('tab_' + name).className = 'taboff';
    document.getElementById('content_' + name).style.visibility = 'hidden';
  }

  // Select the active tab.
  Code.selected = clickedName;
  document.getElementById('tab_' + clickedName).className = 'tabon';
  // Show the selected pane.
  document.getElementById('content_' + clickedName).style.visibility =
    'visible';
  Code.renderContent();
  if (clickedName == 'blocks') {
    Code.workspace.setVisible(true);
  }
  Blockly.svgResize(Code.workspace);
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Code.renderContent = function () {
  var content = document.getElementById('content_' + Code.selected);
  // Initialize the pane.
  if (content.id == 'content_python') {
    Code.attemptCodeGeneration(Blockly.Python);
  }
  if (typeof PR == 'object') {
    PR.prettyPrint();
  }
};

/**
 * Attempt to generate the code and display it in the UI, pretty printed.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.attemptCodeGeneration = function (generator) {
  var content = document.getElementById('content_' + Code.selected);
  content.textContent = '';
  if (Code.checkAllGeneratorFunctionsDefined(generator)) {
    var code = generator.workspaceToCode(Code.workspace);
    content.textContent = code;
    // Remove the 'prettyprinted' class, so that Prettify will recalculate.
    content.className = content.className.replace('prettyprinted', '');
  }
};

/**
 * Check whether all blocks in use have generator functions.
 * @param generator {!Blockly.Generator} The generator to use.
 */
Code.checkAllGeneratorFunctionsDefined = function (generator) {
  var blocks = Code.workspace.getAllBlocks(false);
  var missingBlockGenerators = [];
  for (var i = 0; i < blocks.length; i++) {
    var blockType = blocks[i].type;
    if (!generator[blockType]) {
      if (missingBlockGenerators.indexOf(blockType) == -1) {
        missingBlockGenerators.push(blockType);
      }
    }
  }

  var valid = missingBlockGenerators.length == 0;
  if (!valid) {
    var msg = 'The generator code for the following blocks not specified for ' +
      generator.name_ + ':\n - ' + missingBlockGenerators.join('\n - ');
    Blockly.alert(msg); // Assuming synchronous. No callback.
  }
  return valid;
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function () {
  Code.initLanguage();

  var container = document.getElementById('content_area');
  var onresize = function (e) {
    var bBox = Code.getBBox_(container);
    for (var i = 0; i < Code.TABS_.length; i++) {
      var el = document.getElementById('content_' + Code.TABS_[i]);
      el.style.top = bBox.y + 'px';
      el.style.left = bBox.x + 'px';
      // Height and width need to be set, read back, then set again to
      // compensate for scrollbars.
      el.style.height = bBox.height + 'px';
      el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
      el.style.width = bBox.width + 'px';
      el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    }
    // Make the 'Blocks' tab line up with the toolbox.
    if (Code.workspace && Code.workspace.toolbox_.HtmlDiv.clientWidth) {
      document.getElementById('tab_blocks').style.minWidth =
        (Code.workspace.toolbox_.HtmlDiv.clientWidth - 38) + 'px';
      // Account for the 19 pixel margin and on each side.
    }
  };
  window.addEventListener('resize', onresize, false);

  // const {
  //   ipcRenderer
  // } = require('electron');

  // Drag to load a file.
  var dragbox = document.getElementById('content_blocks');
  dragbox.ondragover = function () {
    event.preventDefault();
  };
  dragbox.ondrop = function (event) {
    event.preventDefault();
    var file = event.dataTransfer.files[0];
    console.log(file.name.split('.')[1].toLowerCase());
    if (file.name.split('.')[1].toLowerCase() == 'xml') {
      BlocklyStorage.readXMLFile(file, Blockly.getMainWorkspace());
      document.getElementById('projectName').value = file.name.split('.')[0];
    } else {
      Blockly.alert(MSG['typeError']);
    }
  };

  // ipcRenderer.send('app-version', 'version');
  // ipcRenderer.on('app-version', (event, arg) => {
  //   document.getElementById('version').innerText = 'Version: ' + arg.version;
  //   ipcRenderer.removeAllListeners('app_version');
  // })

  // The toolbox XML specifies each category name using Blockly's messaging
  // format (eg. `<category name="%{BKY_CATLOGIC}">`).
  // These message keys need to be defined in `Blockly.Msg` in order to
  // be decoded by the library. Therefore, we'll use the `MSG` dictionary that's
  // been defined for each language to import each category name message
  // into `Blockly.Msg`.
  // TODO: Clean up the message files so this is done explicitly instead of
  // through this for-loop.
  for (var messageKey in MSG) {
    if (messageKey.indexOf('cat') == 0) {
      Blockly.Msg[messageKey.toUpperCase()] = MSG[messageKey];
    }
  }

  // Construct the toolbox XML, replacing translated variable names.
  var toolboxText = document.getElementById('toolbox').outerHTML;
  toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g,
    function (m, p1, p2) {
      return p1 + MSG[p2];
    });
  var toolboxXml = Blockly.Xml.textToDom(toolboxText);

  var renderer = 'geras';
  //var renderer = 'zelos';

  Code.workspace = Blockly.inject('content_blocks', {
    grid: {
      spacing: 25,
      length: 3,
      colour: '#ccc',
      snap: true
    },
    media: 'src/media/',
    toolbox: toolboxXml,
    renderer: renderer,
    zoom: {
      controls: true,
      wheel: false,
      startScale: 1.0,
      maxScale: 2.828,
      minScale: 0.5,
      scaleSpeed: 1.414
    },
    move: {
      scrollbars: true,
      drag: false,
      wheel: true
    }
  });


  Code.loadBlocks('');

  if ('BlocklyStorage' in window) {
    // Hook a save function onto unload.
    BlocklyStorage.backupOnUnload(Code.workspace);
  }

  Code.tabClick(Code.selected);

  if ('BlocklyStorage' in window) {
    BlocklyStorage['XML_ERROR'] = MSG['xmlError'];
  }
  Code.bindClick('openButton',
    function () {
      Code.openFile();
    })
  Code.bindClick('saveButton',
    function () {
      Code.saveFile();
    })
  Code.bindClick('trashButton',
    function () {
      Code.discard();
      Code.renderContent();
    });
  Code.bindClick('runButton', Code.runPython);
  Code.bindClick('savePYButton',
    function () {
      Code.savePython()
    });
  // Code.bindClick('clearOutputButton',
  //   function () {
  //     document.getElementById('output').value = '';
  //   }
  // )

  for (var i = 0; i < Code.TABS_.length; i++) {
    var name = Code.TABS_[i];
    Code.bindClick('tab_' + name,
      function (name_) {
        return function () {
          Code.tabClick(name_);
        };
      }(name));
  }
  onresize();
  Blockly.svgResize(Code.workspace);

  // Lazy-load the syntax-highlighting.
  window.setTimeout(Code.importPrettify, 1);
};

/**
 * Initialize the page language.
 */
Code.initLanguage = function () {
  // Set the HTML's language and direction.
  document.dir = 'ltr';
  document.head.parentElement.setAttribute('lang', Code.LANG);

  // Sort languages alphabetically.
  var languages = [];
  for (var lang in Code.LANGUAGE_NAME) {
    languages.push([Code.LANGUAGE_NAME[lang], lang]);
  }
  var comp = function (a, b) {
    // Sort based on first argument ('English', 'Русский', '简体字', etc).
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
  };
  languages.sort(comp);
  // Populate the language selection menu.
  var languageMenu = document.getElementById('languageMenu');
  languageMenu.options.length = 0;
  for (var i = 0; i < languages.length; i++) {
    var tuple = languages[i];
    var lang = tuple[tuple.length - 1];
    var option = new Option(tuple[0], lang);
    if (lang == Code.LANG) {
      option.selected = true;
    }
    languageMenu.options.add(option);
  }
  languageMenu.addEventListener('change', Code.changeLanguage, true);

  // Inject language strings.
  document.title += ' ' + MSG['title'];
  document.getElementById('tab_blocks').textContent = MSG['blocks'];
  // document.getElementById('output_title').textContent = MSG['outputs']

  document.getElementById('projectName').placeholder = MSG['defaultName']
  document.getElementById('projectName').title = MSG['nameTooltip'];
  document.getElementById('openButton').title = MSG['openTooltip'];
  document.getElementById('saveButton').title = MSG['saveTooltip'];
  document.getElementById('runButton').title = MSG['runTooltip'];
  document.getElementById('savePYButton').title = MSG['stopTooltip'];
  document.getElementById('trashButton').title = MSG['trashTooltip'];
  // document.getElementById('clearOutputButton').title = MSG['clearOutputTooltip'];
};

/**
 * Open a saved Xml file to load blocks.
 */
Code.openFile = function () {
  var fileElem = document.getElementById("fileElem");
  fileElem.onchange = function () {
    BlocklyStorage.readXMLFile(this.files[0], Blockly.getMainWorkspace());
    document.getElementById('projectName').value = this.files[0].name.split('.')[0];
  };

  fileElem.click();
}

/**
 * Save the current workspace to a Xml file.
 */
Code.saveFile = function () {
  var xml = Blockly.Xml.workspaceToDom(Code.workspace);
  var code = Blockly.Xml.domToPrettyText(xml);

  // var blob = new Blob([code], {
  //   type: 'text/xml'
  // });
  // var src = URL.createObjectURL(blob);
  // var link = document.createElement('a');
  if (document.getElementById('projectName').value == '') {
    document.getElementById('projectName').value = document.getElementById('projectName').placeholder;
  };

  bridgeJS.getBlocks(document.getElementById('projectName').value + "," + code);
  // link.download = document.getElementById('projectName').value + '.xml';
  // link.style.display = 'none';
  // link.href = src;
  // document.body.appendChild(link);
  // link.click();
  // document.body.removeChild(link);
}
/**
 * Execute the user's code.
 * Generate a projectName.py file and execute it.
 */
Code.runPython = function () {
  // if (child !== null) {
  //   child.kill();
  //   child = null;
  // }

  // var fs = require('fs');
  var code = Blockly.Python.workspaceToCode(Code.workspace);

  if (document.getElementById('projectName').value == '') {
    document.getElementById('projectName').value = document.getElementById('projectName').placeholder;
  };

  bridgeJS.getPython(code);
  // var filename = 'Desktop/' + document.getElementById('projectName').value + '.py'
  // var pyfile = require('path').join(require('os').homedir(), filename);
  // fs.writeFile(pyfile, code, 'utf8', (err) => {
    // if (err) {
      // return Blockly.alert(err);
    // }
  // });

  // const {
  //   spawn
  // } = require('child_process');
  // if (process.platform === 'linux' && process.arch === 'arm') {
  //   child = spawn('python3', ['-u', pyfile]);
  // } else {
  //   child = spawn('python', ['-u', pyfile]);
  // }

  // child.stdout.on('data', (data) => {
  //   var iconv = require('iconv-lite');
  //   var outData;
  //   if (process.platform === 'win32') {
  //     if (navigator.language === 'zh-CN' || navigator.language === 'zh-SG') {
  //       outData = iconv.decode(Buffer.from(data), 'gbk');
  //     } else if (navigator.language === 'zh-TW' || navigator.language === 'zh-HK') {
  //       outData = iconv.decode(Buffer.from(data), 'cp950');
  //     } else {
  //       outData = Buffer.from(data, 'utf8').toString('utf8');
  //     }
  //   } else {
  //     outData = Buffer.from(data, 'utf8').toString('utf8');
  //   }
  //   if (outData.includes('PROMPT:')) {
  //     document.getElementById('output').value += outData.split('PROMPT:')[0];
  //     document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
  //     Blockly.prompt(outData.split('PROMPT:')[1], '', function (input) {
  //       var inputData = Buffer.from(input + '\n');
  //       if (process.platform === 'win32') {
  //         if (navigator.language === 'zh-CN' || navigator.language === 'zh-SG') {
  //           inputData = iconv.encode(input + '\n', 'gbk');
  //         } else if (navigator.language === 'zh-TW' || navigator.language === 'zh-HK') {
  //           inputData = iconv.encode(input + '\n', 'cp950');
  //         }
  //       }
  //       child.stdin.write(inputData, 'utf8');
  //     });
  //   } else {
  //     document.getElementById('output').value += outData;
  //     document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
  //   }
  // });

  // child.stderr.on('data', (err) => {
  //   document.getElementById('output').value += Buffer.from(err, 'utf8').toString();
  //   document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
  // });

  // child.on('exit', () => {
  //   document.getElementById('output').value += MSG['codeEnd'];
  //   document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
  //   child = null;
  // })
};

/**
 * Save the user's code.
 * Generate a projectName.py file.
 */
Code.savePython = function () {
  var code = Blockly.Python.workspaceToCode(Code.workspace);

  if (document.getElementById('projectName').value == '') {
    document.getElementById('projectName').value = document.getElementById('projectName').placeholder;
  };

  bridgeJS.getCode(document.getElementById('projectName').value + "," + code);
}

/**
 * Discard all blocks from the workspace.
 */
Code.discard = function () {
  var count = Code.workspace.getAllBlocks(false).length;
  if (count < 2) {
    Code.workspace.clear();
  } else {
    Blockly.confirm(Blockly.Msg['DELETE_ALL_BLOCKS'].replace('%1', count), function (ok) {
      if (ok) {
        Code.workspace.clear();
      }
    });
  }
};

// Load the Code demo's language strings.
document.write('<script src="src/msg/' + Code.LANG + '.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="src/msg/js/' + Code.LANG + '.js"></script>\n');

window.addEventListener('load', Code.init);

/**
 * File modified by Zhang Yiwei
 */