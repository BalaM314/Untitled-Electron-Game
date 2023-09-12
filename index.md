Technical document: contains explanations of how bits of the code work.











## tick loop
Each stage is called for every building that has the function.
Pre-tick: try to set state based on changes made in the previous tick (such as receiving an item)
Power update:
on all consumers getRequestedPower() called, total power requested is found
on all producers getMaxPowerProduction() called, total power available is found
power network load fraction found, all producers' efficiency set
all consumers' efficiency set
Tick: decrease timers and spawn items



## random stuff below

tick 1:
generator 1 has a capacity of 50 PU and generator 2 has a capacity of 100 PU
consumers are requesting a total of 50 PU
there needs to be some sort of negotiation...
if consumption is low, generators


generator1 consumes fuel every 5 ticks
t1: fuel noticed, timer set to 5, decremented to 4
t2: 4-3
t3: 3-2
t4: 2-1
t5: 1-0
t6: ticks, notices timer is zero, refuses to produce power

consumer1: ticks, after power negotiation is done, realizes there is insufficient power and reduces progress timer by a less amount


tick process:
go to all buildings and see how much power they want, then tell them how much power they'll get

go to power consumers and total the requested power, then go to power producers
no need to tell the producers how much power is requested, just total the available power
then divide, clamp, and tell the consumers and producers how much power they will be making


pre tick:
go through all consumers and call the getPowerConsumption():consumption method
total
go through all producers can call the getMaxPowerProduction():production method
total
divide consumption / production
tell each producer the power required by... calling setEfficiency()
tell each consumer the power available by calling setEfficiency()
tick:
decrement timers, if timer completed spawn an item which can get pushed to another building

(on next tick, if the other building was a consumer, it will notice it can run and request power pre tick...)
pre tick needs to set recipes


efficiency...

