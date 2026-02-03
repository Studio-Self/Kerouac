class Connection < ApplicationRecord
  belongs_to :user
  has_many :posts, dependent: :destroy

  enum :platform, { substack: 0, ghost: 1, medium: 2 }
  enum :status, { pending: 0, active: 1, error: 2, disconnected: 3 }

  encrypts :credentials

  validates :name, presence: true
  validates :identifier, presence: true
  validates :platform, presence: true
  validates :identifier, uniqueness: { scope: [:user_id, :platform], message: "is already connected" }

  before_validation :set_default_status, on: :create

  scope :by_platform, ->(platform) { where(platform: platform) }
  scope :syncable, -> { where(status: [:pending, :active]) }

  def syncable?
    pending? || active?
  end

  def sync!
    service_class = sync_service_class
    return unless service_class

    service = service_class.new(self)
    service.sync
  end

  def mark_synced!
    update!(last_synced_at: Time.current, status: :active, last_error: nil)
  end

  def mark_error!(error_message)
    update!(status: :error, last_error: error_message)
  end

  def parsed_credentials
    return {} if credentials.blank?
    JSON.parse(credentials)
  rescue JSON::ParserError
    {}
  end

  def credentials_hash=(hash)
    self.credentials = hash.to_json
  end

  private

  def set_default_status
    self.status ||= :pending
  end

  def sync_service_class
    case platform
    when "substack"
      SubstackSyncService
    when "ghost"
      GhostSyncService
    when "medium"
      MediumSyncService
    end
  end
end
