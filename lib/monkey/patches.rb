require 'monkey/bootstrap_form/markdown_editor'

module OmniAuth
  module Strategies
    class Steam < OmniAuth::Strategies::OpenID
      def callback_phase
        return fail!(:fuck_off) unless validate_params(openid_response.signed_fields)
        super
      end

    private
      def validate_params(fields)
        allowed_params = [
          'openid.ns',
          'openid.mode',
          'openid.op_endpoint',
          'openid.claimed_id',
          'openid.identity',
          'openid.return_to',
          'openid.response_nonce',
          'openid.assoc_handle',
          'openid.signed',
          'openid.sig',
        ]

        fields.all? { |key| allowed_params.include?(key) }
      end
    end
  end
end
