def priority(p, n, gantt):
    # each row: [pid, arrival, burst, priority, remaining, ct, tat, wt]

    # lowest priority number goes first; arrival time is ignored when choosing
    # (ties: the smaller pid goes first)
    p.sort(key=lambda x: (x[3], x[0]))

    time = 0
    for x in p:
        x[1] = 0                  # arrival is treated as 0, so nothing waits for a late arrival
        start = time
        time += x[2]
        gantt.append([x[0], start, time])

        x[4] = 0                  # remaining
        x[5] = time               # completion time
        x[6] = x[5] - x[1]        # turnaround time
        x[7] = x[6] - x[2]        # waiting time

    return p