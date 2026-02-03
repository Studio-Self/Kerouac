FactoryBot.define do
  factory :post do
    association :user
    association :connection
    sequence(:external_id) { |n| "post-#{n}" }
    sequence(:title) { |n| "My Blog Post #{n}" }
    url { "https://example.com/post" }
    published_at { Time.current }
    post_type { :article }
    word_count { rand(500..2000) }

    trait :newsletter do
      post_type { :newsletter }
    end

    trait :podcast do
      post_type { :podcast }
    end

    trait :note do
      post_type { :note }
    end

    trait :today do
      published_at { Time.current }
    end

    trait :yesterday do
      published_at { 1.day.ago }
    end

    trait :last_week do
      published_at { 1.week.ago }
    end

    trait :last_month do
      published_at { 1.month.ago }
    end
  end
end
