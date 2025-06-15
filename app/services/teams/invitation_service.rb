module Teams
  module InvitationService
    include BaseService

    def call(team, user)
      invite = team.invites.new(user:)

      invite.transaction do
        invite.save || rollback!

        msg = "You have been invited to join the team: #{team.name}."
        Users::NotificationService.call(user, message: msg, link: team_path(team))
      end

      invite
    end
  end
end
