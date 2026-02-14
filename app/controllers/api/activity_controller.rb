module Api
  class ActivityController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :authenticate_user!

    def index
      days = params[:days]&.to_i || 365
      days = [ days, 365 ].min # Cap at 365 days

      streak_calculator = StreakCalculatorService.new(current_user)

      render json: {
        activity: streak_calculator.streak_data(days: days),
        current_streak: streak_calculator.current_streak,
        longest_streak: streak_calculator.longest_streak,
        weekly_summary: streak_calculator.weekly_summary,
        monthly_summary: streak_calculator.monthly_summary
      }
    end

    def stats
      render json: {
        total_posts: current_user.posts.count,
        total_word_count: current_user.posts.sum(:word_count),
        posts_this_week: current_user.posts.this_week.count,
        posts_this_month: current_user.posts.this_month.count,
        posts_this_year: current_user.posts.this_year.count,
        platform_breakdown: current_user.posts.group(:platform).count,
        post_type_breakdown: current_user.posts.group(:post_type).count,
        connections_count: current_user.connections.count,
        active_connections: current_user.connections.active.count
      }
    end

    def daily_counts
      start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
      end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.current

      counts = current_user.posts.daily_counts(start_date: start_date, end_date: end_date)

      render json: { daily_counts: counts }
    end
  end
end
