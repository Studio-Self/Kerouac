class Post < ApplicationRecord
  belongs_to :user
  belongs_to :connection, counter_cache: true

  enum :platform, { substack: 0, ghost: 1, medium: 2 }
  enum :post_type, { article: 0, newsletter: 1, podcast: 2, note: 3 }

  validates :external_id, presence: true, uniqueness: { scope: :connection_id }
  validates :title, presence: true
  validates :published_at, presence: true
  validates :platform, presence: true

  scope :by_date_range, ->(start_date, end_date) {
    where(published_at: start_date.beginning_of_day..end_date.end_of_day)
  }
  scope :by_platform, ->(platform) { where(platform: platform) }
  scope :recent, ->(limit = 10) { order(published_at: :desc).limit(limit) }
  scope :this_week, -> { by_date_range(Date.current.beginning_of_week, Date.current) }
  scope :this_month, -> { by_date_range(Date.current.beginning_of_month, Date.current) }
  scope :this_year, -> { by_date_range(Date.current.beginning_of_year, Date.current) }

  before_validation :set_platform_from_connection, on: :create

  def self.daily_counts(start_date:, end_date:)
    by_date_range(start_date, end_date)
      .group("DATE(published_at)")
      .count
      .transform_keys { |date| date.to_s }
  end

  def self.total_word_count
    sum(:word_count)
  end

  private

  def set_platform_from_connection
    self.platform ||= connection&.platform
  end
end
