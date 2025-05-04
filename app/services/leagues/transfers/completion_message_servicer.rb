module Leagues
  module Transfers
    module CompletionMessageServicer
      include BaseService

      def notify_users(request, user, roster)
        msg  = message user_transfer_msg(request, roster)
        link = team_path(roster.team)

        Users::NotificationService.call(user, message: msg, link:)
      end

      def user_transfer_msg(request, roster)
        if request.is_joining?
          "into #{roster.name}"
        else
          "out of #{roster.name}"
        end + " for #{roster.league.name}"
      end

      def notify_captains(request, user, roster)
        msg  = message captains_transfer_msg(request, user, roster)
        link = team_path(roster.team)

        User.which_can(:edit, roster.team).each do |captain|
          Users::NotificationService.call(captain, message: msg, link:)
        end
      end

      def captains_transfer_msg(request, user, roster)
        if request.is_joining?
          "#{user.name} into #{roster.name}"
        else
          "#{user.name} out of #{roster.name}"
        end + " for #{roster.league.name}"
      end
    end
  end
end
