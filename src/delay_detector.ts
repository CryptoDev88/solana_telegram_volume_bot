
export class DelayDetector {
    private startTime: number = 0
    private endTime: number = 0
    private tag: string = ''
    constructor(tag = '') {
        this.startTime = new Date().getTime()
        this.tag = tag
    }

    estimate(log = true) {
        this.endTime = new Date().getTime()
        const spent = this.endTime - this.startTime
        if (log) {
            console.log(`[${this.tag}] Duration: ${spent} ms`)
        }

        return spent
    }
}