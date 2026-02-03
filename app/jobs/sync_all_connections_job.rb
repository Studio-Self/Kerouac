class SyncAllConnectionsJob < ApplicationJob
  queue_as :default

  def perform(user_id: nil)
    connections = if user_id
      Connection.where(user_id: user_id).syncable
    else
      Connection.syncable
    end

    Rails.logger.info("[SyncAllConnectionsJob] Queuing sync for #{connections.count} connections")

    connections.find_each do |connection|
      SyncConnectionJob.perform_later(connection.id)
    end
  end
end
