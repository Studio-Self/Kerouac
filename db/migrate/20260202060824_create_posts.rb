class CreatePosts < ActiveRecord::Migration[8.1]
  def change
    create_table :posts do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :connection, null: false, foreign_key: { on_delete: :cascade }
      t.string :external_id, null: false
      t.integer :platform, null: false
      t.string :title, limit: 500, null: false
      t.string :url, limit: 2048, null: false
      t.datetime :published_at, null: false
      t.integer :post_type, default: 0
      t.integer :word_count

      t.timestamps
    end

    add_index :posts, [:user_id, :published_at]
    add_index :posts, [:connection_id, :external_id], unique: true
    add_index :posts, :published_at
  end
end
