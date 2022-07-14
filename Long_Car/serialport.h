#ifndef SERIALPORT_H
#define SERIALPORT_H

#include <QObject>
#include <QWidget>
#include <QDebug>
#include <QSerialPort>
#include <QSerialPortInfo>

class SerialPort : public QObject
{
    Q_OBJECT
public:
    explicit SerialPort(QObject *parent = nullptr);
    ~SerialPort();
public slots:
    void slotReadData();
    void OpenCom(QString port, int baud);
    void CloseCom();
    void Send(QString text);
    void refreshPort();

public:
    QSerialPort*m_port;     //串口对象
    QByteArray  m_dataCom;  //从串口读取到的数据
    QStringList m_serialPortName; // 串口名
    QStringList m_serialPortDescription; // 串口描述
};

#endif // SERIALPORT_H
