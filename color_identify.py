import cv2
import numpy as np
from loongpio import LED
from time import sleep
RED = LED(2)
GREEN = LED(60)
YELLOW = LED(7)
WHITE = LED(1)

frameWidth = 640
frameHeight = 480
cap = cv2.VideoCapture(0)  # 获取摄像头
cap.set(3, 640)
cap.set(4, 480)
cap.set(10, 100)  # 调节亮度

red = [[2, 107, 0, 19, 255, 255],[133, 56, 0, 159, 156, 255],[57, 76, 0, 100, 255, 255]]
green = [[100, 32, 33, 45, 255, 255],[54, 77, 103, 255, 100, 255],[79, 16, 0, 150, 180, 255]]
yellow = [[55, 55, 103, 50, 0, 255],[100, 109, 13, 255, 50, 255],[78, 170, 0, 30, 255, 255]]
white = [[255, 0, 255, 150, 150, 150],[0, 255, 0, 0, 255, 255],[255, 255, 0, 0, 255, 255]]

# 识别色彩
def findred(img, red):
    imgHSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    for color in red:
        lower = np.array(color[0:3])  # 下限
        upper = np.array(color[3:6])  # 上限
        mask = cv2.inRange(imgHSV, lower, upper)
        x, y = getContours(mask)
        cv2.circle(imgResult, (x, y), 10, (255, 0, 0), cv2.FILLED)
        cv2.imshow("str(color[i])", mask)
    return 1

def findgreen(img, green):
    imgHSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    for color in green:
        lower = np.array(color[0:3])  # 下限
        upper = np.array(color[3:6])  # 上限
        mask = cv2.inRange(imgHSV, lower, upper)
        x, y = getContours(mask)
        cv2.circle(imgResult, (x, y), 10, (255, 0, 0), cv2.FILLED)
        cv2.imshow("str(color[i])", mask)
    return 2

def findyellow(img, yellow):
    imgHSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    for color in yellow:
        lower = np.array(color[0:3])  # 下限
        upper = np.array(color[3:6])  # 上限
        mask = cv2.inRange(imgHSV, lower, upper)
        x, y = getContours(mask)
        cv2.circle(imgResult, (x, y), 10, (255, 0, 0), cv2.FILLED)
        cv2.imshow("str(color[i])", mask)
    return 3

def findwhite(img, white):
    imgHSV = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    for color in white:
        lower = np.array(color[0:3])  # 下限
        upper = np.array(color[3:6])  # 上限
        mask = cv2.inRange(imgHSV, lower, upper)
        x, y = getContours(mask)
        cv2.circle(imgResult, (x, y), 10, (255, 0, 0), cv2.FILLED)
        cv2.imshow("str(color[i])", mask)
    return 4

def getContours(img):
    contours, hierarchy = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)  # 检测外部轮廓
    x, y, w, h = 0, 0, 0, 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 300:
            cv2.drawContours(imgResult, cnt, -1, (255, 0, 0), 3)
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            x, y, w, h = cv2.boundingRect(approx)  # xy对象的宽和高
    return x + w // 2, y


while True:
    success, img = cap.read()
    imgResult = img.copy()
    findColor(img, myColors)
    if findred() == 1:
        RED.on()
        sleep(2)
        RED.off()
    if findwhite() == 4:
        WHITE.on()
        sleep(2)
        WHITE.off()
    if findyellow() == 3:
        YELLOW.on()
        sleep(2)
        YELLOW.off()
    if findgreen() == 2:
        GREEN.on()
        sleep(2)
        GREEN.off()

    cv2.imshow("video", imgResult)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()