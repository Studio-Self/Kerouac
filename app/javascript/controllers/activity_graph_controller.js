import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["graph"]
  static values = { data: Array }

  connect() {
    this.render()
  }

  render() {
    const data = this.sortedData()
    if (!data || data.length === 0) return

    const container = this.graphTarget
    container.innerHTML = ""

    // Group data by weeks
    const weeks = this.groupByWeeks(data)

    // Create graph container
    const graphWrapper = document.createElement("div")
    graphWrapper.className = "flex gap-1"

    // Add month labels
    const monthLabels = document.createElement("div")
    monthLabels.className = "flex mb-1 text-xs"
    monthLabels.style.paddingLeft = "24px"
    monthLabels.style.color = "#996633"

    let currentMonth = null
    weeks.forEach((week, index) => {
      const firstDay = this.parseDate(week[0].date)
      const month = firstDay.toLocaleDateString('en-US', { month: 'short' })
      if (month !== currentMonth) {
        const label = document.createElement("span")
        label.textContent = month.toUpperCase()
        label.style.marginLeft = index === 0 ? "0" : "auto"
        label.className = "mr-2"
        monthLabels.appendChild(label)
        currentMonth = month
      }
    })

    // Day labels
    const dayLabels = document.createElement("div")
    dayLabels.className = "flex flex-col gap-1 mr-1 text-xs"
    dayLabels.style.color = "#996633"
    const days = ["", "Mon", "", "Wed", "", "Fri", ""]
    days.forEach(day => {
      const label = document.createElement("div")
      label.className = "h-3 leading-3"
      label.style.fontSize = "10px"
      label.textContent = day
      dayLabels.appendChild(label)
    })

    // Create weeks
    const weeksContainer = document.createElement("div")
    weeksContainer.className = "flex gap-1"

    weeks.forEach(week => {
      const weekColumn = document.createElement("div")
      weekColumn.className = "flex flex-col gap-1"

      // Pad the first week if it doesn't start on Sunday
      const firstDayOfWeek = this.parseDate(week[0].date).getDay()
      for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement("div")
        emptyCell.className = "w-3 h-3"
        weekColumn.appendChild(emptyCell)
      }

      week.forEach(day => {
        const cell = document.createElement("div")
        cell.className = `w-3 h-3 ${this.getLevelClass(day.level)}`
        cell.title = `${day.date}: ${day.count} post${day.count !== 1 ? 's' : ''}`
        cell.style.cursor = "pointer"
        weekColumn.appendChild(cell)
      })

      weeksContainer.appendChild(weekColumn)
    })

    graphWrapper.appendChild(dayLabels)
    graphWrapper.appendChild(weeksContainer)

    container.appendChild(graphWrapper)
  }

  groupByWeeks(data) {
    const weeks = []
    let currentWeek = []

    data.forEach((day, index) => {
      const date = this.parseDate(day.date)
      const dayOfWeek = date.getDay()

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push(day)

      if (index === data.length - 1 && currentWeek.length > 0) {
        weeks.push(currentWeek)
      }
    })

    return weeks
  }

  exportTwitterImage(event) {
    event.preventDefault()

    const button = event.currentTarget
    const originalText = button.textContent
    button.disabled = true
    button.textContent = "RENDERING..."

    try {
      const data = this.sortedData()
      if (!data.length) return

      const canvas = this.buildTwitterCanvas(data)
      const endDate = data[data.length - 1].date
      this.downloadCanvas(canvas, `kerouac-activity-${endDate}.png`)
    } finally {
      button.disabled = false
      button.textContent = originalText
    }
  }

  buildTwitterCanvas(data) {
    const width = 1200
    const height = 675
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Canvas context unavailable")
    }

    const background = ctx.createLinearGradient(0, 0, width, height)
    background.addColorStop(0, "#080808")
    background.addColorStop(1, "#14110d")
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = "rgba(255, 136, 51, 0.06)"
    ctx.lineWidth = 1
    for (let x = 40; x < width; x += 48) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    const cardX = 42
    const cardY = 42
    const cardW = width - 84
    const cardH = height - 84
    this.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20, "#0d0d0d", "#2d2620", 2)

    const totalPosts = data.reduce((sum, day) => sum + day.count, 0)
    const activeDays = data.filter((day) => day.count > 0).length
    const currentStreak = this.calculateCurrentStreak(data)
    const longestStreak = this.calculateLongestStreak(data)

    const startDate = this.formatDate(data[0].date)
    const endDate = this.formatDate(data[data.length - 1].date)

    ctx.fillStyle = "#ff944d"
    ctx.font = "700 46px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
    ctx.fillText("WRITING ACTIVITY", cardX + 34, cardY + 66)

    ctx.fillStyle = "#c1895d"
    ctx.font = "500 18px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
    ctx.fillText(`${startDate} - ${endDate}`, cardX + 34, cardY + 98)

    const statY = cardY + 118
    const statHeight = 58
    const statGap = 14
    const statWidth = (cardW - 68 - statGap * 3) / 4
    const stats = [
      { label: "Total Posts", value: `${totalPosts}` },
      { label: "Active Days", value: `${activeDays}` },
      { label: "Current Streak", value: `${currentStreak}d` },
      { label: "Best Streak", value: `${longestStreak}d` }
    ]

    stats.forEach((stat, index) => {
      const x = cardX + 34 + (statWidth + statGap) * index
      this.drawRoundedRect(ctx, x, statY, statWidth, statHeight, 10, "#15110d", "#352a21", 1)

      ctx.fillStyle = "#9b7455"
      ctx.font = "500 12px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
      ctx.fillText(stat.label.toUpperCase(), x + 14, statY + 20)

      ctx.fillStyle = "#ffb16e"
      ctx.font = "700 25px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
      ctx.fillText(stat.value, x + 14, statY + 47)
    })

    const weeks = this.groupByWeeks(data)
    const columns = weeks.length
    const rows = 7
    const xGap = 4
    const yGap = 4
    const chartX = cardX + 34
    const chartY = statY + statHeight + 34
    const chartW = cardW - 68
    const chartH = cardH - (chartY - cardY) - 86
    const dayLabelWidth = 58
    const usableW = chartW - dayLabelWidth

    const cellSize = Math.floor(Math.min(
      (usableW - xGap * (columns - 1)) / columns,
      (chartH - yGap * (rows - 1)) / rows
    ))

    const gridWidth = columns * cellSize + xGap * (columns - 1)
    const gridHeight = rows * cellSize + yGap * (rows - 1)
    const gridX = chartX + dayLabelWidth + Math.floor((usableW - gridWidth) / 2)
    const gridY = chartY + Math.floor((chartH - gridHeight) / 2)

    const dayLabels = [
      { text: "Mon", row: 1 },
      { text: "Wed", row: 3 },
      { text: "Fri", row: 5 }
    ]
    dayLabels.forEach(({ text, row }) => {
      ctx.fillStyle = "#a67956"
      ctx.font = "500 15px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
      const y = gridY + row * (cellSize + yGap) + cellSize * 0.8
      ctx.fillText(text, chartX, y)
    })

    let month = null
    let lastMonthX = -Infinity
    weeks.forEach((week, index) => {
      const date = this.parseDate(week[0].date)
      const next = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
      const x = gridX + index * (cellSize + xGap)
      if (next !== month && x - lastMonthX > 36) {
        ctx.fillStyle = "#b37f58"
        ctx.font = "500 13px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
        ctx.fillText(next, x, gridY - 12)
        month = next
        lastMonthX = x
      }
    })

    const latestDate = data[data.length - 1].date
    weeks.forEach((week, weekIndex) => {
      const firstDayOffset = this.parseDate(week[0].date).getDay()
      week.forEach((day, dayIndex) => {
        const row = firstDayOffset + dayIndex
        const x = gridX + weekIndex * (cellSize + xGap)
        const y = gridY + row * (cellSize + yGap)
        const fill = this.getExportLevelColor(day.level)
        const stroke = day.date === latestDate ? "#ffd9bb" : "rgba(0, 0, 0, 0)"
        this.drawRoundedRect(ctx, x, y, cellSize, cellSize, 3, fill, stroke, day.date === latestDate ? 2 : 0)
      })
    })

    const legendY = gridY + gridHeight + 34
    ctx.fillStyle = "#9d7556"
    ctx.font = "500 14px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
    ctx.fillText("Less", gridX, legendY + 12)

    for (let level = 0; level <= 4; level += 1) {
      const x = gridX + 48 + level * (cellSize + 8)
      this.drawRoundedRect(ctx, x, legendY, cellSize, cellSize, 3, this.getExportLevelColor(level), null, 0)
    }

    ctx.fillText("More", gridX + 48 + 5 * (cellSize + 8) + 12, legendY + 12)

    ctx.textAlign = "right"
    ctx.fillStyle = "#7f6148"
    ctx.font = "500 13px 'JetBrains Mono', 'SF Mono', Menlo, monospace"
    ctx.fillText("Generated by KEROUAC", cardX + cardW - 34, cardY + cardH - 24)
    ctx.textAlign = "left"

    return canvas
  }

  drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle = null, lineWidth = 1) {
    const r = Math.min(radius, width / 2, height / 2)

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()

    if (fillStyle) {
      ctx.fillStyle = fillStyle
      ctx.fill()
    }

    if (strokeStyle && lineWidth > 0) {
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = lineWidth
      ctx.stroke()
    }
  }

  downloadCanvas(canvas, filename) {
    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = filename
    link.click()
  }

  calculateCurrentStreak(data) {
    if (!data.length) return 0

    let index = data.length - 1
    if (data[index].count === 0) index -= 1

    let streak = 0
    while (index >= 0 && data[index].count > 0) {
      streak += 1
      index -= 1
    }

    return streak
  }

  calculateLongestStreak(data) {
    let longest = 0
    let current = 0

    data.forEach((day) => {
      if (day.count > 0) {
        current += 1
        longest = Math.max(longest, current)
      } else {
        current = 0
      }
    })

    return longest
  }

  sortedData() {
    return [...(this.dataValue || [])].sort((a, b) => a.date.localeCompare(b.date))
  }

  parseDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  formatDate(dateString) {
    return this.parseDate(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  getExportLevelColor(level) {
    switch (level) {
      case 0: return "#1b1b1b"
      case 1: return "#6a2b00"
      case 2: return "#a54200"
      case 3: return "#d45f00"
      case 4: return "#ff9140"
      default: return "#1b1b1b"
    }
  }

  getLevelClass(level) {
    // Orange-themed activity levels matching the ASCII terminal aesthetic
    switch (level) {
      case 0: return "activity-level-0"
      case 1: return "activity-level-1"
      case 2: return "activity-level-2"
      case 3: return "activity-level-3"
      case 4: return "activity-level-4"
      default: return "activity-level-0"
    }
  }
}
