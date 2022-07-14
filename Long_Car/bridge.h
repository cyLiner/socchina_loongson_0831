#ifndef BRIDGE_H
#define BRIDGE_H

#include <QObject>
#include <QFile>
#include <QFileDialog>

class bridge : public QObject
{
    Q_OBJECT
public:
    explicit bridge(QObject *parent = nullptr);

signals:
    void newBlocks();
    void newPython();
    void newCode();

public slots:
    void getBlocks(QString data);
    void getPython(QString data);
    void getCode(QString data);

public:
    QStringList blocks;
    QStringList code;
    QString python;
};

#endif // BRIDGE_H
