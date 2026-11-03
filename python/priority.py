def priority(p, n):
    time = 0
    done = []

    while len(done) < n:
        ready = [x for x in p if x[1] <= time and x[0] not in done]

        if not ready:
            time = min(x[1] for x in p if x[0] not in done)
            continue

        x = min(ready, key=lambda x: x[3])
        time += x[2]
        x.extend([time, time-x[1], time-x[1]-x[2]])
        done.append(x[0])

    return p
