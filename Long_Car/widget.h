#ifndef WIDGET_H
#define WIDGET_H

#include <QWidget>
#include <QWebChannel>
#include <QMessageBox>
#include "serialport.h"
#include "bridge.h"

QT_BEGIN_NAMESPACE
namespace Ui { class Widget; }
QT_END_NAMESPACE

class Widget : public QWidget
{
    Q_OBJECT

public:
    Widget(QWidget *parent = nullptr);
    ~Widget();

private slots:
    void saveFile(QStringList text, QString type);
    void saveBlocks();
    void flashPython();
    void saveCode();
    void on_freshPort_clicked();

private:
    void Sleep(int msec);

private:
    Ui::Widget *ui;
    SerialPort serialPort;
    bridge *mybride;
};
#endif // WIDGET_H
