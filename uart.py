import serial
import os
import time

ser = serial.Serial("/dev/ttyS3",9600)       #UART5

while 1:
    begin=ser.read_all()
    if(begin != b''):
    
        print(begin)
    if begin=="start".encode() or begin=="\r\nstart".encode():
        ser.write("start to send code...".encode())
        print("start to send code...")
        os.system('touch Desktop/code.py')

        data = ""
        while 1:
            recv = ser.read_all()
            #ser.write(recv)
            if(recv=="sendover".encode()):     #sign of over_send
                ser.write("send complete!".encode())
                break
            if recv !=b'':
                data = data + str(recv)[2:-1]
            
        data = data.replace("\\r\\n", "\r\n") 
        data = data.replace("\\n", "\n")
        file = open("Desktop/code.py","w")
        file.truncate()
        print(data)
        file.write(data)
        file.close()

        time.sleep(3)
        os.system('python3 Desktop/code.py')
        ser.write("running the code...".encode())