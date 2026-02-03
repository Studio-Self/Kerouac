import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["graph"]
  static values = { data: Array }

  connect() {
    this.render()
  }

  render() {
    const data = this.dataValue
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
      const firstDay = new Date(week[0].date)
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
      const firstDayOfWeek = new Date(week[0].date).getDay()
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
      const date = new Date(day.date)
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
