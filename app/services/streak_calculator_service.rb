class StreakCalculatorService
  attr_reader :user, :end_date

  def initialize(user, end_date: Date.current)
    @user = user
    @end_date = end_date
  end

  def current_streak
    calculate_streak_from(end_date)
  end

  def longest_streak
    return 0 if user.posts.empty?

    dates = posting_dates
    return 0 if dates.empty?

    max_streak = 1
    current = 1

    dates.each_cons(2) do |prev_date, curr_date|
      if (curr_date - prev_date).to_i == 1
        current += 1
        max_streak = [max_streak, current].max
      else
        current = 1
      end
    end

    max_streak
  end

  def streak_data(days: 365)
    start_date = end_date - days.days

    daily_counts = user.posts
      .by_date_range(start_date, end_date)
      .group("DATE(published_at)")
      .count

    (start_date..end_date).map do |date|
      {
        date: date.to_s,
        count: daily_counts[date] || 0,
        level: activity_level(daily_counts[date] || 0)
      }
    end
  end

  def weekly_summary
    start_of_week = end_date.beginning_of_week
    end_of_week = end_date.end_of_week

    posts_this_week = user.posts.by_date_range(start_of_week, end_of_week)

    {
      posts_count: posts_this_week.count,
      word_count: posts_this_week.sum(:word_count),
      platforms: posts_this_week.group(:platform).count,
      daily_breakdown: posts_this_week.group("DATE(published_at)").count
    }
  end

  def monthly_summary
    start_of_month = end_date.beginning_of_month
    end_of_month = end_date.end_of_month

    posts_this_month = user.posts.by_date_range(start_of_month, end_of_month)

    {
      posts_count: posts_this_month.count,
      word_count: posts_this_month.sum(:word_count),
      platforms: posts_this_month.group(:platform).count,
      weekly_breakdown: weekly_breakdown(posts_this_month)
    }
  end

  private

  def calculate_streak_from(date)
    streak = 0
    current_date = date

    loop do
      if posted_on?(current_date)
        streak += 1
        current_date -= 1.day
      elsif current_date == date && !posted_on?(current_date)
        # Check yesterday if no post today
        current_date -= 1.day
        next if posted_on?(current_date)
        break
      else
        break
      end
    end

    streak
  end

  def posted_on?(date)
    user.posts.where(published_at: date.beginning_of_day..date.end_of_day).exists?
  end

  def posting_dates
    user.posts
      .order(:published_at)
      .pluck(Arel.sql("DATE(published_at)"))
      .uniq
  end

  def activity_level(count)
    case count
    when 0 then 0
    when 1 then 1
    when 2..3 then 2
    when 4..5 then 3
    else 4
    end
  end

  def weekly_breakdown(posts)
    posts.group_by { |p| p.published_at.beginning_of_week.to_date }
         .transform_values(&:count)
  end
end
