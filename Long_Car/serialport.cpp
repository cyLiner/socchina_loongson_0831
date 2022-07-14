#include "serialport.h"
#include <QMap>

SerialPort::SerialPort(QObject *parent)
    : QObject{parent}
{
    m_port = new QSerialPort();
    //获取串口信息，填入下拉列表框内

    foreach(const QSerialPortInfo &info,QSerialPortInfo::availablePorts())
    {
        m_serialPortName << info.portName();
        m_serialPortDescription << info.description();
    }

    qDebug() << __LINE__ << "serialPortName:" << m_serialPortName;
    qDebug() << __LINE__ << "serialPortName:" << m_serialPortDescription;


    connect(m_port,SIGNAL(readyRead()),this,SLOT(slotReadData()));
}

SerialPort::~SerialPort()
{
    delete m_port;
}

void SerialPort::slotReadData()
{
    QByteArray  data;
    const int   nMax    =   64 * 1024;
    for(;;)
    {
        data    =   m_port->readAll();
        if(data.isEmpty())
        {
            break;
        }

        m_dataCom.append(data);
        if(m_dataCom.size() > nMax)
        {
            m_dataCom   =   m_dataCom.right(nMax);
        }
    }
}

void SerialPort::OpenCom(QString port, int baud)
{
    if(!m_port->isOpen())
    {
        m_dataCom.clear();
        m_port->setPortName(port);
        qDebug() << __LINE__ << port;
        m_port->setBaudRate(baud);
        qDebug() << __LINE__ << baud;
        m_port->setParity(QSerialPort::NoParity);
        m_port->setDataBits(QSerialPort::Data8);
        m_port->setStopBits(QSerialPort::OneStop);
        bool    bRTS    =   false;  //流控制是否为硬件
        switch(0)
        {
        case 1://硬件 RTS/CTS
            bRTS    =   true;
            m_port->setFlowControl(QSerialPort::HardwareControl);
            break;
        case 2://软件
            m_port->setFlowControl(QSerialPort::SoftwareControl);
            break;
        default://无
            m_port->setFlowControl(QSerialPort::NoFlowControl);
            break;
        }
        if(m_port->open(QIODevice::ReadWrite))
        {
            if(!bRTS)
            {//流控制为硬件时，会自动管理 RTS 的状态
             //流控制不为硬件时，需要设置 RTS、DTR 为高电平，保证对方能顺利的发送数据过来
                m_port->setRequestToSend(true);
                m_port->setDataTerminalReady(true);
            }
        }
    }
}

void SerialPort::CloseCom()
{
    if(m_port->isOpen())
    {
        m_port->close();
    }
}

void SerialPort::Send(QString text)
{
    QByteArray data = text.toUtf8();
    if(!data.isEmpty())
    {
        m_port->write(data);
        m_port->waitForBytesWritten(5000);
    }
}

void SerialPort::refreshPort()
{
    if(m_port->isOpen())
    {
        m_port->close();
    }

    foreach(const QSerialPortInfo &info,QSerialPortInfo::availablePorts())
    {
        m_serialPortName << info.portName();
        m_serialPortDescription << info.description();
    }


}
