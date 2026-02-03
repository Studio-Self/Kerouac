module ApplicationHelper
  def platform_badge_class(platform)
    case platform.to_s
    when "substack"
      "bg-orange-50 text-orange-700 ring-orange-600/20"
    when "ghost"
      "bg-purple-50 text-purple-700 ring-purple-600/20"
    when "medium"
      "bg-gray-50 text-gray-700 ring-gray-600/20"
    else
      "bg-blue-50 text-blue-700 ring-blue-600/20"
    end
  end

  def status_badge_class(status)
    case status.to_s
    when "active"
      "bg-green-50 text-green-700 ring-green-600/20"
    when "pending"
      "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
    when "error"
      "bg-red-50 text-red-700 ring-red-600/20"
    when "disconnected"
      "bg-gray-50 text-gray-700 ring-gray-600/20"
    else
      "bg-gray-50 text-gray-700 ring-gray-600/20"
    end
  end
end
