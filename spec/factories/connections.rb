FactoryBot.define do
  factory :connection do
    association :user
    platform { :substack }
    sequence(:name) { |n| "My Blog #{n}" }
    sequence(:identifier) { |n| "myblog#{n}" }
    status { :active }

    trait :substack do
      platform { :substack }
    end

    trait :ghost do
      platform { :ghost }
      credentials { { api_url: "https://example.ghost.io", admin_api_key: "key:secret" }.to_json }
    end

    trait :medium do
      platform { :medium }
    end

    trait :pending do
      status { :pending }
    end

    trait :error do
      status { :error }
      last_error { "Failed to sync" }
    end

    trait :with_posts do
      transient do
        posts_count { 5 }
      end

      after(:create) do |connection, evaluator|
        create_list(:post, evaluator.posts_count, connection: connection, user: connection.user)
      end
    end
  end
end
