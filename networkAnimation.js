class NetworkAnimationConfig {
    constructor() {
        this.nodeDensity = 0.4
        this.velocityFactor = 0.6
        this.maxConnDistance = 300
        this.nodeColor = "#666688"
        this.nodeRadius = 1.8
        this.connColor = "#666688"
        this.connLineWidth = 0.4
        this.packetSpawnPeriodMax = 5000
    }
}

class NetworkAnimation {
    constructor(canvas, conf) {
        this.canvas = canvas
        this.conf = conf
        this.ctx = this.canvas.getContext('2d')
        this.squaredMaxConnDistance = this.conf.maxConnDistance * this.conf.maxConnDistance
        this.transmission = undefined
        window.addEventListener("resize", this.reset.bind(this))
    }

    reset() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.alphaFadeState = 0
        this.transmission = undefined
        this.populate()
    }

    populate() {
        this.nodes = []
        let count = (this.canvas.width * this.canvas.height) / (100 * 100)
        count *= this.conf.nodeDensity
        count = Math.floor(count)
        for (let i = 0; i < count; i++) {
            this.nodes[i] = new Node(
                [this.canvas.width, this.canvas.height],
                this.conf.velocityFactor
            )
        }
    }

    draw() {
        if (this.nodes.length < 1) {
            window.requestAnimationFrame(this.draw.bind(this));
            console.log("NO NODES")
            return;
        }
        for (const node of this.nodes) node.update()
        if (this.alphaFadeState < 1) {
            this.alphaFadeState += 0.005
        } else {
            this.alphaFadeState = 1
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.globalAlpha = 1 * this.alphaFadeState
        this.ctx.fillStyle = this.conf.nodeColor
        for (const node of this.nodes) {
            this.ctx.beginPath();
            this.ctx.arc(
                node.x,
                node.y,
                this.conf.nodeRadius,
                0,
                2 * Math.PI
            );
            this.ctx.fill();
        }

        this.ctx.strokeStyle = this.conf.connColor
        this.ctx.lineWidth = this.conf.connLineWidth
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                let a = this.nodes[i]
                let b = this.nodes[j]
                if (a.squaredDistance(b) > this.squaredMaxConnDistance) continue
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.globalAlpha = (1 - a.squaredDistance(b) / this.squaredMaxConnDistance) * this.alphaFadeState
                this.ctx.stroke();
            }
        }

        this.ctx.strokeStyle = "red"
        this.ctx.lineWidth = 2
        if (this.transmission) {
            for (let i = 0; i < this.transmission.length - 1; i++) {
                let a = this.nodes[this.transmission[i]]
                let b = this.nodes[this.transmission[i + 1]]
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.globalAlpha = this.alphaFadeState
                this.ctx.stroke();
            }
        }

        window.requestAnimationFrame(this.draw.bind(this));
    }

    sendPacket() {
        if (this.nodes.length >= 2) {
            const ai = Math.floor(Math.random() * this.nodes.length)
            let bi = ai
            while (ai === bi) bi = Math.floor(Math.random() * this.nodes.length)

            const path = this.shortestPath(ai, bi)
            if (path) {
                this.transmission = path
            }
        }
        setTimeout(this.sendPacket.bind(this), Math.random() * this.conf.packetSpawnPeriodMax)
    }

    /*
    shortestPath tries to find the shortest path between node a (node index ai) and b (node index bi) in this.nodes
    to find that path, Dijkstra's algorithm (https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) is used

    if there is no path available, undefined is returned
    */
    shortestPath(ai, bi) {
        // we are using the Node class itself to store the algorithm's states:
        // - visited (false): this node was processed already
        // - distance (Infinity): the current smallest distance to node a
        // - parent (undefined): index of the next parent in the found path
        // for every call, we have to reset these states
        this.nodes.forEach(n => n.initPathFindingState())

        // select node a as current node, set distance to 0
        let current = ai
        this.nodes[current].distance = 0

        while (true) {
            let nearest = undefined

            // 1) iterate all unvisited neighbours (for our use case, nodes with a distance <= this.squaredMaxConnDistance) of the current node, and...
            for (let i = 0; i < this.nodes.length; i++) {
                if (current === i || this.nodes[i].visited) continue
                let distance = this.nodes[current].squaredDistance(this.nodes[i])
                if (distance > this.squaredMaxConnDistance) continue
                // ...calculate the distance to the node through the current node
                distance += this.nodes[current].distance
                // ...if the new distance is smaller than the old one: replace it and assign the current node as parent
                if (distance < this.nodes[i].distance) {
                    this.nodes[i].distance = distance
                    this.nodes[i].parent = current
                }
                // ...check if this neighbour is the nearest one and replace the node index/distance if so
                if (!nearest) {
                    nearest = [i, distance]
                } else {
                    if (distance < nearest[1]) nearest = [i, distance]
                }
            }

            // 2) mark the current node as visited
            this.nodes[current].visited = true

            if (nearest) {
                // 3a) select the nearest neighbour as current node
                current = nearest[0]
            } else {
                // 3b) if no unvisited neighbour was found, try to select the node with
                //     - the smallest distance
                //     - which was not visited before
                //     as current node
                let candidate = undefined
                for (let i = 0; i < this.nodes.length; i++) {
                    if (this.nodes[i].visited) continue
                    if (!candidate) {
                        candidate = [i, this.nodes[i].distance]
                    } else {
                        if (this.nodes[i].distance < candidate[1]) candidate = [i, this.nodes[i].distance]
                    }
                }
                if (candidate) {
                    current = candidate[0]
                } else {
                    // 4) no more unvisited nodes left, we are done
                    // ***
                    // we may have multiple graphs, which are not connected to each other
                    // in that case, when traversing the path back to node a, we will encounter a undefined parent and report back that there is no path available
                    // ***
                    let path = []
                    let next = this.nodes[bi].parent
                    while (next !== ai) {
                        if (next === undefined) {
                            return undefined
                        }
                        path.push(next)
                        next = this.nodes[next].parent
                    }
                    return path
                }
            }
        }
    }

    animate() {
        this.reset();
        this.sendPacket();
        this.draw();
    }
}


class Node {
    constructor(max, vFactor) {
        this.max = max
        this.x = Math.floor(Math.random() * this.max[0])
        this.y = Math.floor(Math.random() * this.max[1])
        this.dx = (Math.random() - 0.5) * vFactor
        this.dy = (Math.random() - 0.5) * vFactor
        this.visited = undefined
        this.distance = undefined
        this.parent = undefined
    }

    update() {
        if (this.x + this.dx > this.max[0] || this.x + this.dx < 0) this.dx = -this.dx;
        if (this.y + this.dy > this.max[1] || this.y + this.dy < 0) this.dy = -this.dy;
        this.x += this.dx;
        this.y += this.dy;
    }

    squaredDistance(node) {
        let dx = this.x - node.x
        let dy = this.y - node.y
        return dx * dx + dy * dy
    }

    initPathFindingState() {
        this.visited = false
        this.distance = Infinity
        this.parent = undefined
    }
}
