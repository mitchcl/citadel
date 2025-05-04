module Leagues
  class RostersController < ApplicationController
    include RosterPermissions
    include TeamPermissions

    before_action only: [:index, :new, :create] do
      @league = League.find(params[:league_id])
    end

    before_action except: [:index, :new, :create] do
      @roster = League::Roster.find(params[:id])
      @league = @roster.league
    end

    # team_id may or may not exist
    before_action only: [:new] do
      @team = Team.where(id: params[:team_id]).first
    end

    before_action only: [:create] do
      @team = Team.find(params[:team_id])
    end

    before_action :require_can_sign_up, only: [:new, :create]
    before_action :require_league_permission, only: [:index, :review, :approve]
    before_action :require_roster_league_permission, only: [:undisband]
    before_action :require_roster_permission, only: [:edit, :update]
    before_action :require_roster_pending, only: [:review, :approve]
    before_action :require_roster_disbandable, only: :disband
    before_action :require_roster_destroyable, only: :destroy

    def index
      @divisions = @league.divisions.includes(:rosters)
    end

    def new
      @roster = @league.divisions.first.rosters.new

      if @team
        @roster.team = @team
        @roster.name = @team.name
        @team.users.each { |user| @roster.players.new(user:) }
      else
        @teams = current_user.authorized_teams_for(@league)
      end
    end

    def create
      @roster = Rosters::CreationService.call(@league, @team, new_roster_params)

      if @roster.persisted?
        redirect_to team_path(@roster.team)
      else
        render :new
      end
    end

    def edit
      @comment = League::Roster::Comment.new
      @comments = @roster.comments.ordered.includes(:created_by)
      @transfer_request ||= @roster.transfer_requests.new
      @users_on_roster    = @roster.users
      @users_off_roster   = @roster.users_off_roster
    end

    def update
      if @roster.update(edit_roster_params)
        redirect_to team_path(@roster.team)
      else
        edit
        render :edit
      end
    end

    def review
    end

    def approve
      if @roster.update(approve_roster_params.merge(approved: true))
        redirect_to league_rosters_path(@league)
      else
        render :review
      end
    end

    def disband
      if @roster.disband
        redirect_to team_path(@roster.team)
      else
        edit
        render :edit
      end
    end

    def undisband
      if @roster.update(disbanded: false)
        redirect_to team_path(@roster.team)
      else
        edit
        render :edit
      end
    end

    def destroy
      if @roster.destroy
        redirect_to league_path(@league)
      else
        edit
        render :edit
      end
    end

    private

    def schedule_params
      @params_schedule_data ||= params[:roster].delete(:schedule_data)
      @params_schedule_data&.permit!
    end

    def new_roster_params
      param = params.require(:roster).permit(:name, :description, :division_id,
                                             players_attributes: [:user_id])

      whitelist_schedule_params(param)
    end

    def edit_roster_params
      roster = params.require(:roster)

      params = if user_can_edit_league?
                 roster.permit(:name, :description, :notice, :ranking,
                               :seeding, :division_id)
               else
                 roster.permit(:description)
               end

      params = whitelist_schedule_params(params) unless @league.schedule_locked?

      params
    end

    def whitelist_schedule_params(params)
      params.tap do |whitelisted|
        whitelisted[:schedule_data] = schedule_params
      end
    end

    def approve_roster_params
      params.require(:roster).permit(:name, :division_id, :seeding)
    end

    def redirect_to_league
      redirect_to league_path(@league)
    end

    def redirect_to_team
      redirect_to team_path(@roster.team)
    end

    def require_can_sign_up
      redirect_to_league unless user_can_sign_up?
    end

    def require_league_permission
      redirect_to_league unless user_can_edit_league?
    end

    def require_roster_league_permission
      redirect_to_team unless user_can_edit_league?
    end

    def require_roster_pending
      redirect_back(fallback_location: league_rosters_path(@league)) if @roster.approved?
    end

    def require_roster_permission
      redirect_to_team unless user_can_edit_roster?
    end

    def require_roster_disbandable
      redirect_to_team unless user_can_disband_roster?
    end

    def require_roster_destroyable
      redirect_to_team unless user_can_destroy_roster?
    end
  end
end
