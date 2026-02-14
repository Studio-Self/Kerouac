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

    const metrics = this.calculateExportMetrics(data)
    this.drawTwitterBackground(ctx, width, height)

    const frame = { x: 30, y: 30, w: width - 60, h: height - 60 }
    const leftPanel = { x: frame.x + 24, y: frame.y + 24, w: 336, h: frame.h - 48 }
    const chartPanel = { x: leftPanel.x + leftPanel.w + 18, y: leftPanel.y, w: frame.w - leftPanel.w - 66, h: leftPanel.h }

    this.drawRoundedRect(ctx, frame.x, frame.y, frame.w, frame.h, 28, "rgba(10, 15, 22, 0.86)", "rgba(94, 120, 152, 0.5)", 2)
    this.drawRoundedRect(ctx, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, 22, "rgba(16, 24, 36, 0.95)", "rgba(94, 120, 152, 0.35)", 1)
    this.drawRoundedRect(ctx, chartPanel.x, chartPanel.y, chartPanel.w, chartPanel.h, 22, "rgba(13, 20, 31, 0.95)", "rgba(94, 120, 152, 0.35)", 1)

    ctx.fillStyle = "#74d6ff"
    ctx.font = "600 17px 'SF Mono', Menlo, Monaco, monospace"
    ctx.fillText("KEROUAC", leftPanel.x + 24, leftPanel.y + 34)

    ctx.fillStyle = "#f5f8ff"
    ctx.font = "700 45px 'SF Pro Display', 'Segoe UI', sans-serif"
    ctx.fillText("Writing", leftPanel.x + 24, leftPanel.y + 88)
    ctx.fillText("Activity", leftPanel.x + 24, leftPanel.y + 138)

    ctx.fillStyle = "#9fb6d6"
    ctx.font = "500 17px 'SF Pro Text', 'Segoe UI', sans-serif"
    ctx.fillText(`${metrics.startDate} - ${metrics.endDate}`, leftPanel.x + 24, leftPanel.y + 170)

    const statCards = [
      { label: "Total posts", value: `${metrics.totalPosts}` },
      { label: "Active days", value: `${metrics.activeDays} (${metrics.activityRate}%)` },
      { label: "Current streak", value: `${metrics.currentStreak} days` },
      { label: "Best streak", value: `${metrics.longestStreak} days` }
    ]

    const statStartY = leftPanel.y + 196
    const statHeight = 68
    const statGap = 12
    statCards.forEach((stat, index) => {
      const y = statStartY + index * (statHeight + statGap)
      this.drawTwitterStat(ctx, leftPanel.x + 20, y, leftPanel.w - 40, statHeight, stat.label, stat.value)
    })

    ctx.fillStyle = "#74d6ff"
    ctx.font = "600 14px 'SF Mono', Menlo, Monaco, monospace"
    ctx.fillText("LAST 30 DAYS", leftPanel.x + 24, leftPanel.y + leftPanel.h - 90)
    ctx.fillStyle = "#f5f8ff"
    ctx.font = "700 30px 'SF Pro Display', 'Segoe UI', sans-serif"
    ctx.fillText(`${metrics.postsLast30} posts`, leftPanel.x + 24, leftPanel.y + leftPanel.h - 54)
    ctx.fillStyle = "#9fb6d6"
    ctx.font = "500 13px 'SF Pro Text', 'Segoe UI', sans-serif"
    ctx.fillText(`Best day: ${metrics.bestDay}`, leftPanel.x + 24, leftPanel.y + leftPanel.h - 30)

    ctx.fillStyle = "#f5f8ff"
    ctx.font = "700 28px 'SF Pro Display', 'Segoe UI', sans-serif"
    ctx.fillText("365-Day Heatmap", chartPanel.x + 24, chartPanel.y + 40)

    const weeks = this.groupByWeeks(data)
    const columns = Math.max(weeks.length, 1)
    const rows = 7
    const xGap = 3
    const yGap = 3
    const chartX = chartPanel.x + 68
    const chartY = chartPanel.y + 96
    const chartW = chartPanel.w - 90
    const chartH = chartPanel.h - 172

    const cellSize = Math.max(7, Math.floor(Math.min(
      (chartW - xGap * (columns - 1)) / columns,
      (chartH - yGap * (rows - 1)) / rows
    )))

    const gridWidth = columns * cellSize + xGap * (columns - 1)
    const gridHeight = rows * cellSize + yGap * (rows - 1)
    const gridX = chartX + Math.floor((chartW - gridWidth) / 2)
    const gridY = chartY + Math.floor((chartH - gridHeight) / 2)

    const dayLabels = [
      { label: "Mon", row: 1 },
      { label: "Wed", row: 3 },
      { label: "Fri", row: 5 }
    ]
    dayLabels.forEach(({ label, row }) => {
      ctx.fillStyle = "#8ca6c8"
      ctx.font = "500 13px 'SF Mono', Menlo, Monaco, monospace"
      const y = gridY + row * (cellSize + yGap) + Math.round(cellSize * 0.8)
      ctx.fillText(label, chartPanel.x + 18, y)
    })

    let month = null
    let lastMonthLabelX = -Infinity
    weeks.forEach((week, index) => {
      const monthLabel = this.parseDate(week[0].date).toLocaleDateString("en-US", { month: "short" }).toUpperCase()
      const x = gridX + index * (cellSize + xGap)
      if (monthLabel !== month && x - lastMonthLabelX > 32) {
        ctx.fillStyle = "#8ca6c8"
        ctx.font = "500 12px 'SF Mono', Menlo, Monaco, monospace"
        ctx.fillText(monthLabel, x, gridY - 12)
        month = monthLabel
        lastMonthLabelX = x
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
        const stroke = day.date === latestDate ? "#ffe99f" : null
        this.drawRoundedRect(ctx, x, y, cellSize, cellSize, 3, fill, stroke, stroke ? 2 : 0)
      })
    })

    const legendCell = Math.max(10, cellSize)
    const legendY = chartPanel.y + chartPanel.h - 42
    const legendX = chartPanel.x + chartPanel.w - (legendCell * 5 + 62)
    ctx.fillStyle = "#8ca6c8"
    ctx.font = "500 13px 'SF Mono', Menlo, Monaco, monospace"
    ctx.fillText("Less", legendX - 34, legendY + 11)
    for (let level = 0; level <= 4; level += 1) {
      this.drawRoundedRect(
        ctx,
        legendX + level * (legendCell + 6),
        legendY,
        legendCell,
        legendCell,
        3,
        this.getExportLevelColor(level),
        null,
        0
      )
    }
    ctx.fillText("More", legendX + 5 * (legendCell + 6) + 4, legendY + 11)

    ctx.textAlign = "right"
    ctx.fillStyle = "#8ca6c8"
    ctx.font = "500 13px 'SF Mono', Menlo, Monaco, monospace"
    ctx.fillText("Exported for Twitter - 1200x675", frame.x + frame.w - 24, frame.y + frame.h - 16)
    ctx.textAlign = "left"

    return canvas
  }

  calculateExportMetrics(data) {
    const totalPosts = data.reduce((sum, day) => sum + day.count, 0)
    const activeDays = data.filter((day) => day.count > 0).length
    const activityRate = data.length > 0 ? Math.round((activeDays / data.length) * 100) : 0
    const currentStreak = this.calculateCurrentStreak(data)
    const longestStreak = this.calculateLongestStreak(data)
    const postsLast30 = data.slice(-30).reduce((sum, day) => sum + day.count, 0)
    const strongestDay = data.reduce((best, day) => day.count > best.count ? day : best, data[0])

    return {
      totalPosts,
      activeDays,
      activityRate,
      currentStreak,
      longestStreak,
      postsLast30,
      startDate: this.formatDate(data[0].date),
      endDate: this.formatDate(data[data.length - 1].date),
      bestDay: strongestDay.count > 0 ? `${strongestDay.count} on ${this.formatDate(strongestDay.date)}` : "No published days"
    }
  }

  drawTwitterBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#02050a")
    gradient.addColorStop(0.55, "#081323")
    gradient.addColorStop(1, "#0d1b2d")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = "rgba(116, 214, 255, 0.12)"
    ctx.beginPath()
    ctx.arc(width - 90, 90, 180, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(84, 120, 255, 0.08)"
    ctx.beginPath()
    ctx.arc(80, height - 44, 140, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = "rgba(148, 176, 220, 0.08)"
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 42) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }

  drawTwitterStat(ctx, x, y, width, height, label, value) {
    this.drawRoundedRect(ctx, x, y, width, height, 12, "rgba(25, 37, 54, 0.95)", "rgba(111, 146, 189, 0.42)", 1)

    ctx.fillStyle = "#8eb1dc"
    ctx.font = "600 11px 'SF Mono', Menlo, Monaco, monospace"
    ctx.fillText(label.toUpperCase(), x + 14, y + 22)

    ctx.fillStyle = "#f5f8ff"
    ctx.font = "700 24px 'SF Pro Display', 'Segoe UI', sans-serif"
    ctx.fillText(value, x + 14, y + 50)
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
      case 0: return "#1b2533"
      case 1: return "#1f4c85"
      case 2: return "#2e72af"
      case 3: return "#3d9fcb"
      case 4: return "#72e1ff"
      default: return "#1b2533"
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
