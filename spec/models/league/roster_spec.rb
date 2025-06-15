require 'rails_helper'

describe League::Roster do
  before(:all) { create(:league_roster) }

  it { should belong_to(:team) }

  it { should belong_to(:division) }

  it { should have_many(:transfers).class_name('League::Roster::Transfer') }
  it { should have_many(:home_team_matches).class_name('League::Match') }
  it { should have_many(:away_team_matches).class_name('League::Match') }
  it { should have_many(:comments).class_name('League::Roster::Comment') }
  it { should have_many(:titles).class_name('User::Title') }

  it { should validate_presence_of(:name) }
  it { should validate_uniqueness_of(:name).scoped_to(:division_id) }
  it { should validate_length_of(:name).is_at_least(1) }
  it { should validate_length_of(:name).is_at_most(64) }

  it { should allow_value('').for(:description) }
  it { should validate_length_of(:description).is_at_least(0).is_at_most(1_000) }

  it { should allow_value('').for(:notice) }

  it { should allow_value(nil).for(:ranking) }
  it { should validate_numericality_of(:ranking).is_greater_than(0) }

  it { should allow_value(nil).for(:seeding) }
  it { should validate_numericality_of(:seeding).is_greater_than(0) }

  describe 'player count limits' do
    it 'validates minimum players' do
      comp = build(:league, min_players: 1)
      div = build(:league_division, league: comp)

      expect(build(:league_roster, division: div, player_count: 1)).to be_valid
      expect(build(:league_roster, division: div, player_count: 5)).to be_valid
      expect(build(:league_roster, division: div, player_count: 0)).not_to be_valid
    end

    it 'validates maximum players' do
      comp = build(:league, min_players: 1, max_players: 2)
      div = build(:league_division, league: comp)

      expect(build(:league_roster, division: div, player_count: 1)).to be_valid
      expect(build(:league_roster, division: div, player_count: 2)).to be_valid
      expect(build(:league_roster, division: div, player_count: 3)).not_to be_valid
      expect(build(:league_roster, division: div, player_count: 5)).not_to be_valid
    end

    it 'validates no maximum on players' do
      comp = build(:league, min_players: 1, max_players: 0)
      div = build(:league_division, league: comp)

      expect(build(:league_roster, division: div, player_count: 1)).to be_valid
      expect(build(:league_roster, division: div, player_count: 6)).to be_valid
      expect(build(:league_roster, division: div, player_count: 7)).to be_valid
    end
  end

  describe 'unique within league' do
    it 'validates' do
      comp = create(:league)
      div = build(:league_division, league: comp)
      team = create(:team)

      roster = build(:league_roster, division: div, team:)
      expect(roster).to be_valid
      roster.save!

      div2 = build(:league_division, league: comp)
      roster = build(:league_roster, division: div2, team:)
      expect(roster).to be_invalid
    end
  end

  describe '#matches' do
    it 'returns both home and away matches' do
      roster = create(:league_roster)
      home_match = create(:league_match, home_team: roster)
      away_match = create(:league_match, away_team: roster)

      expect(roster.home_team_matches).to eq([home_match])
      expect(roster.away_team_matches).to eq([away_match])
      expect(roster.matches).to include(home_match)
      expect(roster.matches).to include(away_match)
    end
  end

  describe '#disband' do
    let(:roster) { create(:league_roster) }

    it 'forfeits all matches when enabled in league' do
      home_match = create(:league_match, home_team: roster)
      away_match = create(:league_match, away_team: roster, status: :confirmed)

      roster.disband

      expect(roster.reload.disbanded?).to be(true)
      expect(home_match.reload.forfeit_by).to eq('home_team_forfeit')
      expect(away_match.reload.forfeit_by).to eq('away_team_forfeit')
    end

    it "doesn't forfeit confirmed matches when forfeiting all matches is disabled in league" do
      roster.league.update!(forfeit_all_matches_when_roster_disbands: false)
      home_match = create(:league_match, home_team: roster)
      away_match = create(:league_match, away_team: roster, status: :confirmed)

      roster.disband

      expect(roster.reload.disbanded?).to be(true)
      expect(home_match.reload.forfeit_by).to eq('home_team_forfeit')
      expect(away_match.reload.forfeit_by).to eq('no_forfeit')
    end

    it 'deletes all pending transfer requests' do
      admin = create(:user)
      completed_requests = create_list(:league_roster_transfer_request, 3, approved_by: admin)
      pending_requests = create_list(:league_roster_transfer_request, 3, propagate: true, roster:)

      roster.disband

      completed_requests.each do |request|
        expect(request.reload).to_not be_nil
      end

      pending_requests.each do |request|
        expect { request.reload }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end

  describe '#points' do
    pending
  end
end
