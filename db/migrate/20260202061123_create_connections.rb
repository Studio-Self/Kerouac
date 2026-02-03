class CreateConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :connections do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.integer :platform, null: false, default: 0
      t.string :name, null: false
      t.string :identifier, null: false
      t.text :credentials
      t.integer :status, null: false, default: 0
      t.datetime :last_synced_at
      t.text :last_error
      t.integer :posts_count, null: false, default: 0

      t.timestamps
    end

    add_index :connections, [:user_id, :platform, :identifier], unique: true
    add_index :connections, :platform
    add_index :connections, :status
  end
end
