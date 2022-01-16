class NetworkAnimationConfig {
    constructor() {
        this.updatePeriodMs = 10
        this.nodeDensity = 0.8
        this.velocityFactor = 0.5
        this.maxConnDistance = 250
        this.nodeColor = "#e6dbc8"
        this.nodeRadius = 0.75
        this.connColor = "#e6dbc8"
        this.connLineWidth = 0.15
    }
}

class NetworkAnimation {
    constructor(canvas, conf) {
        this.canvas = canvas
        this.conf = conf
        this.ctx = this.canvas.getContext('2d')
        window.addEventListener("resize", this.reset.bind(this))
    }

    reset() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.alphaFadeState = 0
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

    tick() {
        for (const node of this.nodes) node.update()
        if (this.alphaFadeState < 1) {
            this.alphaFadeState += 0.005
        } else {
            this.alphaFadeState = 1
        }
        setTimeout(this.tick.bind(this), this.conf.updatePeriodMs)
    }

    draw() {
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

        let squaredMaxConnDistance = this.conf.maxConnDistance * this.conf.maxConnDistance

        this.ctx.strokeStyle = this.conf.connColor
        this.ctx.lineWidth = this.conf.connLineWidth
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                let a = this.nodes[i]
                let b = this.nodes[j]
                if (a.squaredDistance(b) > squaredMaxConnDistance) continue
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.globalAlpha = (1 - a.squaredDistance(b) / squaredMaxConnDistance) * this.alphaFadeState
                this.ctx.stroke();
            }
        }

        window.requestAnimationFrame(this.draw.bind(this));
    }

    animate() {
        this.reset();
        this.tick();
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

    /*distance(node) {
        return Math.sqrt(this.squaredDistance(node))
    }*/
}

/*class Conn {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    same(a, b) {
        return (this.a == a && this.b == b) || (this.a == b && this.b == a)
    }
}*/
