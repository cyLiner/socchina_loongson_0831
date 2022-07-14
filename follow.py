from loongpio import Button
from loongpio.pins import *
from loongpio import PWMLED
import time

f0 = None
f1 = None
f2 = None
m0 = None
f3 = None
f4 = None
f5 = None
m1 = None
m2 = None
m3 = None

# \xe5\x88\x9d\xe5\xa7\x8b\xe5\x8c\x96\xe7\xab\xaf\xe5\x8f\xa3
def Init():
    global f0, f1, f2, m0, f3, f4, f5, m1, m2, m3
    f0 = Button(41)
    f1 = Button(57)
    f2 = Button(59)
    f3 = Button(58)
    f4 = Button(56)
    f5 = Button(40)
    m0 = PWMLED(PWM0)
    m1 = PWMLED(PWM1)
    m2 = PWMLED(PWM2)
    m3 = PWMLED(PWM3)
    m0.value = 0/100
    m1.value = 0/100
    m2.value = 0/100
    m3.value = 0/100

time.sleep(20)
Init()
while True:
    if f2.value:
        m0.value = 0/100
        m1.value = 48/100
        m2.value = 52/100
        m3.value = 0/100
    elif f3.value:
        m0.value = 0/100
        m1.value = 52/100
        m2.value = 48/100
        m3.value = 0/100
    elif f1.value:
        m0.value = 0/100
        m1.value = 45/100
        m2.value = 55/100
        m3.value = 0/100
    elif f4.value:
        m0.value = 0/100
        m1.value = 55/100
        m2.value = 45/100
        m3.value = 0/100
    elif f0.value:
        m0.value = 40/100
        m1.value = 0/100
        m2.value = 40/100
        m3.value = 0/100
    elif f5.value:
        m0.value = 0/100
        m1.value = 40/100
        m2.value = 0/100
        m3.value = 40/100
    else:
        pass
