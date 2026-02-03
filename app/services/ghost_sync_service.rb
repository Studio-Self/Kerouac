class GhostSyncService < BaseSyncService
  GHOST_API_VERSION = "v5.0".freeze

  protected

  def fetch_posts
    credentials = connection.parsed_credentials
    api_url = credentials["api_url"]
    admin_api_key = credentials["admin_api_key"]

    raise "Missing Ghost API URL" if api_url.blank?
    raise "Missing Ghost Admin API key" if admin_api_key.blank?

    token = generate_jwt_token(admin_api_key)
    posts = fetch_ghost_posts(api_url, token)

    posts.map do |post|
      {
        external_id: post["id"],
        title: post["title"],
        url: post["url"],
        published_at: parse_ghost_date(post["published_at"]),
        word_count: calculate_word_count(post),
        post_type: determine_post_type(post)
      }
    end
  end

  private

  def generate_jwt_token(admin_api_key)
    key_id, secret = admin_api_key.split(":")
    raise "Invalid Admin API key format" if key_id.blank? || secret.blank?

    iat = Time.now.to_i
    exp = iat + 5 * 60 # Token valid for 5 minutes

    header = { alg: "HS256", typ: "JWT", kid: key_id }
    payload = { iat: iat, exp: exp, aud: "/admin/" }

    # Decode hex secret
    decoded_secret = [secret].pack("H*")

    JWT.encode(payload, decoded_secret, "HS256", header)
  end

  def fetch_ghost_posts(api_url, token)
    url = "#{api_url.chomp('/')}/ghost/api/admin/posts/"

    response = Faraday.new(url: url) do |conn|
      conn.request :json
      conn.response :json
      conn.adapter Faraday.default_adapter
    end.get do |req|
      req.headers["Authorization"] = "Ghost #{token}"
      req.params["limit"] = "all"
      req.params["filter"] = "status:published"
      req.params["fields"] = "id,title,url,published_at,html,feature_image,newsletter_id"
    end

    raise "Ghost API error: #{response.status}" unless response.success?

    response.body["posts"] || []
  end

  def parse_ghost_date(date_string)
    return Time.current if date_string.blank?
    Time.parse(date_string)
  rescue ArgumentError
    Time.current
  end

  def calculate_word_count(post)
    html = post["html"]
    return 0 if html.blank?

    text = ActionController::Base.helpers.strip_tags(html)
    text.split(/\s+/).length
  end

  def determine_post_type(post)
    if post["newsletter_id"].present?
      :newsletter
    else
      :article
    end
  end
end
