class SubstackSyncService < BaseSyncService
  SUBSTACK_RSS_PATH = "/feed".freeze

  protected

  def fetch_posts
    subdomain = connection.identifier.gsub(/\.substack\.com$/, "")
    rss_url = "https://#{subdomain}.substack.com#{SUBSTACK_RSS_PATH}"

    Rails.logger.info("[SubstackSyncService] Fetching RSS from: #{rss_url}")

    entries = parse_rss_feed(rss_url)

    # Substack posts are typically newsletters
    entries.map do |entry|
      entry.merge(post_type: determine_post_type(entry))
    end
  rescue Faraday::Error => e
    raise "Failed to connect to Substack: #{e.message}"
  rescue Feedjira::NoParserAvailable => e
    raise "Failed to parse Substack RSS feed: #{e.message}"
  end

  private

  def determine_post_type(entry)
    # Most Substack content is newsletter-based
    # Could enhance with more logic based on URL patterns or content analysis
    :newsletter
  end
end
