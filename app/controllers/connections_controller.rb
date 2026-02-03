class ConnectionsController < ApplicationController
  before_action :set_connection, only: [:show, :edit, :update, :destroy, :sync]

  def index
    @connections = current_user.connections.order(created_at: :desc)
  end

  def show
    @posts = @connection.posts.recent(20)
  end

  def new
    @connection = current_user.connections.build
  end

  def create
    @connection = current_user.connections.build(connection_params)

    if @connection.save
      SyncConnectionJob.perform_later(@connection.id)
      redirect_to connections_path, notice: "Connection created successfully. Syncing posts..."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @connection.update(connection_params)
      redirect_to connections_path, notice: "Connection updated successfully."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @connection.destroy
    redirect_to connections_path, notice: "Connection removed successfully."
  end

  def sync
    SyncConnectionJob.perform_later(@connection.id)
    redirect_to connections_path, notice: "Sync started for #{@connection.name}."
  end

  def sync_all
    SyncAllConnectionsJob.perform_later(user_id: current_user.id)
    redirect_to connections_path, notice: "Syncing all connections..."
  end

  private

  def set_connection
    @connection = current_user.connections.find(params[:id])
  end

  def connection_params
    params.require(:connection).permit(:name, :platform, :identifier, :credentials)
  end
end
