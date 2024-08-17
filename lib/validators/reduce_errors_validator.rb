# show only one error message per field
#
class ReduceErrorsValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, _value)
    errors = record.errors
    return until errors.messages.key? attribute

    errors.objects.uniq!(&:attribute)
  end
end
