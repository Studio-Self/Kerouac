class DashboardController < ApplicationController
  def show
    @connections = current_user.connections.includes(:posts)
    @recent_posts = current_user.posts.recent(10).includes(:connection)

    streak_calculator = StreakCalculatorService.new(current_user)
    @current_streak = streak_calculator.current_streak
    @longest_streak = streak_calculator.longest_streak
    @activity_data = streak_calculator.streak_data(days: 365)
    @weekly_summary = streak_calculator.weekly_summary

    @total_posts = current_user.posts.count
    @total_word_count = current_user.posts.sum(:word_count)
    @posts_this_week = current_user.posts.this_week.count
    @posts_this_month = current_user.posts.this_month.count

    @platform_breakdown = current_user.posts.group(:platform).count
  end
end
