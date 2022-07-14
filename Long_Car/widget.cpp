#include "widget.h"
#include "ui_widget.h"


Widget::Widget(QWidget *parent)
    : QWidget(parent)
    , ui(new Ui::Widget)
{
    ui->setupUi(this);
    showMaximized();
    setWindowTitle("龙芯教育派编程平台");
    ui->web->setUrl(QUrl(QStringLiteral("F:/program/QT_program/Long_Car/Long_Car/BlockPi/index.html")));
    ui->buad->addItems(QStringList() << "9600");
    for(int i = 0; i < serialPort.m_serialPortName.length(); ++i)
    {
        ui->port->addItem(serialPort.m_serialPortName[i] + " " + serialPort.m_serialPortDescription[i]);
    }

    QWebChannel *channel = new QWebChannel(this);
    mybride = new bridge();        //创建通道对象用于与JS交互
    channel->registerObject("bridge",(QObject*)mybride);
    ui->web->page()->setWebChannel(channel);

    connect(mybride, SIGNAL(newBlocks()), this, SLOT(saveBlocks()));
    connect(mybride, SIGNAL(newCode()), this, SLOT(saveCode()));
    connect(mybride, SIGNAL(newPython()), this, SLOT(flashPython()));

}

Widget::~Widget()
{
    delete ui;
}

void Widget::saveFile(QStringList text, QString type)
{
    type = "(*" + type + ")";
    qDebug() << __LINE__ << type;
    QString fileName = QFileDialog::getSaveFileName(this,
                                                    tr("保存当前文件"),
                                                    text[0],
                                                    tr(type.toLatin1()));
    QFile file(fileName);

    if (!file.open(QIODevice::WriteOnly|QIODevice::Text))
    {
        QMessageBox::critical(this, "critical", tr("文件保存失败！"),
                              QMessageBox::Yes, QMessageBox::Yes);
    }
    else
    {
        QTextStream stream(&file);
        stream << text[1];
        stream.flush();
        file.close();
    }
}

// save xml blocks
void Widget::saveBlocks()
{
    saveFile(mybride->blocks, ".xml");
}

// save python code
void Widget::saveCode()
{
    saveFile(mybride->code, ".py");
}

void Widget::flashPython()
{
    if (mybride->python == "")
        return;


    if (ui->port->count() > 0)
    {
        serialPort.OpenCom(serialPort.m_serialPortName[ui->port->currentIndex()],
                ui->buad->currentText().toInt());
        serialPort.Send("start");
        Sleep(100);
        serialPort.Send(mybride->python.toUtf8());
        qDebug() << __LINE__ << mybride->python.toUtf8();
        Sleep(100);
//        serialPort.Send("sendover"); // 送出去是乱码
        serialPort.CloseCom();

        QMessageBox::information(this, "提示", tr("烧录成功"),
                              QMessageBox::Yes, QMessageBox::Yes);
    }
}

void Widget::on_freshPort_clicked()
{
    ui->port->clear();
    serialPort.m_serialPortName.clear();
    serialPort.m_serialPortDescription.clear();
    serialPort.refreshPort();
    qDebug() << __LINE__ << "serialPortName:" << serialPort.m_serialPortName;
    qDebug() << __LINE__ << "serialPortName:" << serialPort.m_serialPortDescription;

    for(int i = 0; i < serialPort.m_serialPortName.length(); ++i)
    {
        ui->port->addItem(serialPort.m_serialPortName[i] + " " + serialPort.m_serialPortDescription[i]);
    }
}

void Widget::Sleep(int msec)
{
    QTime dieTime = QTime::currentTime().addMSecs(msec);
    while( QTime::currentTime() < dieTime )
        QCoreApplication::processEvents(QEventLoop::AllEvents, 100);
}
