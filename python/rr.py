def rr(p, n, q, gantt=None):
    time = 0
    i = 0
    queue = []
    completed = 0
    if gantt is None:
        gantt = []

    while completed < n:
        while i < n and p[i][1] <= time:
            queue.append(p[i])
            i += 1

        if not queue:
            time = p[i][1]
            continue

        x = queue.pop(0)
        run = min(q, x[3])
        start = time
        time += run
        x[3] -= run
        gantt.append([x[0], start, time])

        while i < n and p[i][1] <= time:
            queue.append(p[i])
            i += 1

        if x[3] == 0:
            x[4] = time
            x[5] = x[4] - x[1]
            x[6] = x[5] - x[2]
            completed += 1
        else:
            queue.append(x)

    return p
