class MediumSyncService < BaseSyncService
  MEDIUM_RSS_BASE_URL = "https://medium.com/feed".freeze

  protected

  def fetch_posts
    username = connection.identifier
    username = "@#{username}" unless username.start_with?("@")

    rss_url = "#{MEDIUM_RSS_BASE_URL}/#{username}"
    Rails.logger.info("[MediumSyncService] Fetching RSS from: #{rss_url}")

    parse_rss_feed(rss_url)
  rescue Faraday::Error => e
    raise "Failed to connect to Medium: #{e.message}"
  rescue Feedjira::NoParserAvailable => e
    raise "Failed to parse Medium RSS feed: #{e.message}"
  end
end
