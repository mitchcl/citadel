module API
  module V1
    class RostersController < APIController
      def show
        @roster = League::Roster.find(params[:id])

        render json: @roster, serializer: V1::Leagues::RosterSerializer
      end

      def active
        @roster = League::Roster.includes(division: :league).find(params[:id])

        league_status = @roster.division.league&.status
        is_active = league_status.present? &&  league_status == 'running'

        render json: {
          id: @roster.id,
          active: is_active
        }
      end
    end
  end
end
