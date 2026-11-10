def sjf(processes):
    # each row: [pid, arrival, burst]
    p = [list(x) for x in processes]      # don't mutate the input

    # shortest burst first; arrival time is ignored when choosing
    # (ties: the smaller pid goes first)
    p.sort(key=lambda x: (x[2], x[0]))

    time = 0
    for x in p:
        x[1] = 0                 # arrival is treated as 0, so nothing waits for a late arrival
        time += x[2]
        ct = time
        tat = ct - x[1]
        wt = tat - x[2]
        x.extend([ct, tat, wt])

    order = [x[0] for x in p]
    return p, order