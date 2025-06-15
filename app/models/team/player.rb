class Team
  class Player < ApplicationRecord
    belongs_to :team, counter_cache: true
    belongs_to :user

    validates :user, uniqueness: { scope: :team }

    after_create do
      team.transfers.create(user:, is_joining: true)
    end

    after_destroy do
      team.transfers.create(user:, is_joining: false)
    end
  end
end
