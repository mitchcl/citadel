module API
  module V1
    class TeamsController < APIController
      def show
        @team = Team.find(params[:id])

        # Prefetch user permissions
        User.permissions(@team.users).fetch(:edit, @team)

        render json: @team, serializer: TeamSerializer, include: ['*', 'teams.users'], scope: @team
      end
    end
  end
end
