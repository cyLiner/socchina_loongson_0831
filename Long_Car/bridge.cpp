#include <QJsonValue>
#include "bridge.h"
#include "QDebug"
bridge::bridge(QObject *parent) : QObject(parent)
{

}
void bridge::getBlocks(QString data)
{
    blocks.clear();
    int pos = data.indexOf(",");
    blocks << data.left(pos);
    blocks << data.mid(pos+1);
    emit newBlocks();
}

void bridge::getPython(QString data)
{
    python = data;
    emit newPython();
}

void bridge::getCode(QString data)
{
    code.clear();
    int pos = data.indexOf(",");
    code << data.left(pos);
    code << data.mid(pos+1);
    emit newCode();
}
