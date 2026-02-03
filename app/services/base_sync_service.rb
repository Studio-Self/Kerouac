class BaseSyncService
  attr_reader :connection, :errors

  def initialize(connection)
    @connection = connection
    @errors = []
  end

  def sync
    Rails.logger.info("[#{service_name}] Starting sync for connection #{connection.id}")

    begin
      posts_data = fetch_posts
      created_count = 0
      updated_count = 0

      posts_data.each do |post_data|
        post = find_or_initialize_post(post_data[:external_id])
        is_new = post.new_record?

        post.assign_attributes(
          user: connection.user,
          title: post_data[:title],
          url: post_data[:url],
          published_at: post_data[:published_at],
          post_type: post_data[:post_type] || :article,
          word_count: post_data[:word_count] || 0,
          platform: connection.platform
        )

        if post.save
          is_new ? created_count += 1 : updated_count += 1
        else
          @errors << "Failed to save post: #{post.errors.full_messages.join(', ')}"
        end
      end

      connection.mark_synced!
      Rails.logger.info("[#{service_name}] Sync complete. Created: #{created_count}, Updated: #{updated_count}")

      { success: true, created: created_count, updated: updated_count }
    rescue StandardError => e
      Rails.logger.error("[#{service_name}] Sync failed: #{e.message}")
      Rails.logger.error(e.backtrace.first(10).join("\n"))
      connection.mark_error!(e.message)

      { success: false, error: e.message }
    end
  end

  protected

  def fetch_posts
    raise NotImplementedError, "Subclasses must implement #fetch_posts"
  end

  def service_name
    self.class.name
  end

  def find_or_initialize_post(external_id)
    connection.posts.find_or_initialize_by(external_id: external_id)
  end

  def parse_rss_feed(url)
    response = Faraday.get(url)
    raise "Failed to fetch RSS feed: #{response.status}" unless response.success?

    feed = Feedjira.parse(response.body)
    feed.entries.map do |entry|
      {
        external_id: entry.entry_id || entry.url || Digest::SHA256.hexdigest(entry.title.to_s),
        title: entry.title,
        url: entry.url,
        published_at: entry.published || Time.current,
        word_count: estimate_word_count(entry.content || entry.summary),
        post_type: :article
      }
    end
  end

  def estimate_word_count(content)
    return 0 if content.blank?

    # Strip HTML tags and count words
    text = ActionController::Base.helpers.strip_tags(content)
    text.split(/\s+/).length
  end
end
