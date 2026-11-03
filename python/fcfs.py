def fcfs(p):
    p.sort(key=lambda x: x[1])
    time = 0

    for x in p:
        time = max(time, x[1]) + x[2]
        x.extend([time, time-x[1], time-x[1]-x[2]])

    return p
