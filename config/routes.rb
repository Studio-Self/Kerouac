Rails.application.routes.draw do
  devise_for :users

  # Dashboard
  get "dashboard", to: "dashboard#show", as: :dashboard
  root "dashboard#show"

  # Connections
  resources :connections do
    member do
      post :sync
    end
    collection do
      post :sync_all
    end
  end

  # API endpoints
  namespace :api do
    get "activity", to: "activity#index"
    get "activity/stats", to: "activity#stats"
    get "activity/daily_counts", to: "activity#daily_counts"
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
