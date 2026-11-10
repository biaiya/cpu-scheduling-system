def priority(p, n, gantt):
    # each row: [pid, arrival, burst, priority, remaining, ct, tat, wt]

       # the process with arrival 0 (P1) always goes first,
    # then the rest go by lowest priority number (ties: smaller pid)
    p.sort(key=lambda x: (x[1] != 0, x[3], x[0]))

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