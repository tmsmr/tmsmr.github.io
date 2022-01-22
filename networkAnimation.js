/*
MIT License

Copyright (c) 2021 Thomas Maier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/*
There are plenty of JS libs for "particle network animations" available.
This implementation adds "transmission animations" to the network.
The goal is to generate an abstract visual representation of complex software architectures including the inter-service communication...

Since i am building this for my personal website, the implementation might not be portable. Feel free to modify it for your needs or ask me for help.
 */

class NetworkAnimationConfig {
    constructor() {
        this.updatePeriodMs = 10
        this.nodeDensity = 0.25
        this.velocityFactor = 0.1
        this.maxConnDistance = 500
        this.nodeColor = "#999"
        //this.nodeColor = "#bbb"
        this.nodeRadius = 1.6
        this.connColor = "#999"
        //this.connColor = "#ccc"
        this.connLineWidth = 0.4
        this.packetSpawnPeriodMax = 2000
        this.packetSpeed = 2
        this.packetColorA = "#00cc66"
        this.packetColorB = "#3399ff"
    }
}

class NetworkAnimation {
    constructor(canvas, conf) {
        this.canvas = canvas
        this.conf = conf
        this.ctx = this.canvas.getContext('2d')
        this.squaredMaxConnDistance = this.conf.maxConnDistance * this.conf.maxConnDistance
        this.transmissions = []
        window.addEventListener("resize", this.reset.bind(this))
    }

    reset() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.alphaFadeState = 0
        this.transmissions = []
        this.populate()
    }

    populate() {
        let nodes = []
        let count = (this.canvas.width * this.canvas.height) / (100 * 100)
        count *= this.conf.nodeDensity
        count = Math.floor(count)
        for (let i = 0; i < count; i++) {
            nodes[i] = new Node(
                [this.canvas.width, this.canvas.height],
                this.conf.velocityFactor
            )
        }
        this.nodes = nodes
    }

    tick() {
        if (document.hidden) {
            setTimeout(this.tick.bind(this), this.conf.updatePeriodMs)
            return
        }
        // update node positions
        for (const node of this.nodes) node.update()
        // update transmission progresses
        for (let transmission of this.transmissions) {
            for (let section of transmission[0]) {
                if (section[1] < 100) {
                    section[1] += this.conf.packetSpeed
                    break
                }
            }
        }
        // remove finished transmissions
        this.transmissions = this.transmissions.filter(t => t[0][t[0].length - 1][1] < 100)
        if (this.alphaFadeState < 1) {
            this.alphaFadeState += 0.01
        } else {
            this.alphaFadeState = 1
        }
        setTimeout(this.tick.bind(this), this.conf.updatePeriodMs)
    }

    draw() {
        if (this.nodes.length < 1) {
            window.requestAnimationFrame(this.draw.bind(this))
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // nodes
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

        // normal connections
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

        // transmissions
        this.ctx.globalAlpha = this.alphaFadeState
        for (let transmission of this.transmissions) {
            if (transmission[0][1][1] < 100) {
                this.ctx.globalAlpha = this.alphaFadeState * (transmission[0][1][1]/100)
            }
            if (transmission[0][transmission[0].length - 1][1] > 0) {
                this.ctx.globalAlpha = this.alphaFadeState * (1-transmission[0][transmission[0].length - 1][1]/100)
            }
            this.ctx.fillStyle = transmission[1]
            this.ctx.fillStyle = transmission[1]
            // start and end node
            for(let ni of transmission[0]) {
                let node = this.nodes[ni[0]]
                this.ctx.beginPath();
                this.ctx.arc(
                    node.x,
                    node.y,
                    this.conf.nodeRadius * 1.5,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            }
            let ai = undefined, bi = undefined
            let progress = undefined
            for (let i = 0; i < transmission[0].length; i++) {
                if (transmission[0][i][1] < 100) {
                    ai = transmission[0][i - 1][0]
                    bi = transmission[0][i][0]
                    progress = transmission[0][i][1]
                    break
                }
            }
            let edgepos = [(this.nodes[bi].x - this.nodes[ai].x) * progress * 0.01, (this.nodes[bi].y - this.nodes[ai].y) * progress * 0.01]
            this.ctx.beginPath();
            this.ctx.arc(
                edgepos[0] + this.nodes[ai].x,
                edgepos[1] + this.nodes[ai].y,
                this.conf.nodeRadius * 1.5,
                0,
                2 * Math.PI
            );
            this.ctx.fill()
        }

        // active connections
        this.ctx.lineWidth = this.conf.connLineWidth
        this.ctx.globalAlpha = this.alphaFadeState
        this.ctx.lineWidth = this.conf.connLineWidth * 2.5
        for (let transmission of this.transmissions) {
            if (transmission[0][1][1] < 100) {
                this.ctx.globalAlpha = this.alphaFadeState * (transmission[0][1][1]/100)
            }
            if (transmission[0][transmission[0].length - 1][1] > 0) {
                this.ctx.globalAlpha = this.alphaFadeState * (1-transmission[0][transmission[0].length - 1][1]/100)
            }
            this.ctx.strokeStyle = transmission[1]
            let baselineAlpha = this.ctx.globalAlpha
            for (let i = 1; i < transmission[0].length; i++) {
                let a = this.nodes[transmission[0][i - 1][0]]
                let b = this.nodes[transmission[0][i][0]]
                this.ctx.globalAlpha = baselineAlpha * ((((1 - a.squaredDistance(b) / this.squaredMaxConnDistance)) + 1)/2)
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.stroke();
            }
        }
        window.requestAnimationFrame(this.draw.bind(this));
    }

    startPacket() {
        if (document.hidden) {
            setTimeout(this.startPacket.bind(this), Math.random() * this.conf.packetSpawnPeriodMax)
            return
        }
        if (this.nodes.length >= 2) {
            const ai = Math.floor(Math.random() * this.nodes.length)
            let bi = ai
            while (ai === bi) bi = Math.floor(Math.random() * this.nodes.length)

            const path = this.shortestPath(ai, bi)
            if (path) {
                let transmission = []
                for (let section of path) {
                    transmission.push([section, 0])
                }
                transmission[0][1] = 100
                const color = Helpers.gradientColor(this.conf.packetColorA, this.conf.packetColorB, Math.random())
                this.transmissions.push([transmission, color])
            }
        }
        setTimeout(this.startPacket.bind(this), Math.random() * this.conf.packetSpawnPeriodMax)
    }

    reportTransmissions() {
        setTimeout(this.reportTransmissions.bind(this), 1000)
    }

    /*
    shortestPath tries to find the shortest path between node a (node index ai) and b (node index bi) in this.nodes
    to find that path, Dijkstra's algorithm (https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) is used

    if there is no path available, undefined is returned

    let's waste some CPU cycles for a meaningless animation... :)
    */
    shortestPath(ai, bi) {
        // we are using the Node class itself to store the algorithm's states (hooray, side-effects):
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
                    path.push(bi)
                    let next = this.nodes[bi].parent
                    while (next !== ai) {
                        if (next === undefined) {
                            return undefined
                        }
                        path.push(next)
                        next = this.nodes[next].parent
                    }
                    path.push(next)
                    return path.reverse()
                }
            }
        }
    }

    start() {
        this.reset();
        this.tick();
        this.startPacket();
        this.reportTransmissions()
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

class Helpers {
    static toHexStr(v) {
        v = v.toString(16);
        return (v.length === 1) ? '0' + v : v;
    }

    static gradientColor(c1, c2, pos) {
        c1 = c1.replace("#", "")
        c2 = c2.replace("#", "")
        let r = parseInt(c1.substring(0, 2), 16) * pos + parseInt(c2.substring(0,2), 16) * (1-pos)
        let g = parseInt(c1.substring(2, 4), 16) * pos + parseInt(c2.substring(2,4), 16) * (1-pos)
        let b = parseInt(c1.substring(4, 6), 16) * pos + parseInt(c2.substring(4,6), 16) * (1-pos)

        return "#" + Helpers.toHexStr(Math.ceil(r)) + Helpers.toHexStr(Math.ceil(g)) + Helpers.toHexStr(Math.ceil(b))
    }
}
