class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable

  has_many :connections, dependent: :destroy
  has_many :posts, dependent: :destroy

  def total_posts_count
    connections.sum(:posts_count)
  end

  def active_connections_count
    connections.active.count
  end
end
