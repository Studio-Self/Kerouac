class SyncConnectionJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(connection_id)
    connection = Connection.find_by(id: connection_id)

    unless connection
      Rails.logger.warn("[SyncConnectionJob] Connection #{connection_id} not found")
      return
    end

    unless connection.syncable?
      Rails.logger.info("[SyncConnectionJob] Connection #{connection_id} is not syncable (status: #{connection.status})")
      return
    end

    Rails.logger.info("[SyncConnectionJob] Starting sync for connection #{connection_id} (#{connection.platform})")

    result = connection.sync!

    if result[:success]
      Rails.logger.info("[SyncConnectionJob] Sync complete for connection #{connection_id}: #{result[:created]} created, #{result[:updated]} updated")
    else
      Rails.logger.error("[SyncConnectionJob] Sync failed for connection #{connection_id}: #{result[:error]}")
    end
  end

  private

  def syncable?(connection)
    connection.pending? || connection.active?
  end
end
