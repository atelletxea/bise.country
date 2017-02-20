from plone.api.content import get_state
from plone.api.user import get_roles, is_anonymous
from plone.app.iterate.interfaces import ICheckinCheckoutPolicy
from plone.app.layout.viewlets import ViewletBase
from zope.component import getMultiAdapter


class CountryCheckoutViewlet(ViewletBase):
    """ Countries "checkout menu" viewlet
    """

    def state_labels(self):
        return {
            'draft': 'First draft',
            'country_draft': 'Country draft',
            'etc_review': 'Under review by ETC/EEA',
            'published': 'Published',
        }

    def can_checkout(self):
        # user is Contributer, state is published, context is baseline, doesn't
        # have a checkout

        local_roles = get_roles(obj=self.context, inherit=False)

        control = getMultiAdapter((self.context, self.request),
                                  name="iterate_control")

        policy = ICheckinCheckoutPolicy(self.context, None)

        if policy is None:
            return False

        wc = policy.getWorkingCopy()

        is_baseline = not control.is_checkout()
        is_published = get_state(self.context) == 'published'
        is_contributor = 'Contributor' in local_roles
        has_wc = wc is not None

        return is_baseline and is_published and is_contributor and (not has_wc)

    def can_checkin(self):
        # user is Reviewer/Editor, state is submitted, context is wc

        local_roles = get_roles(obj=self.context, inherit=False)

        control = getMultiAdapter((self.context, self.request),
                                  name="iterate_control")

        is_wc = control.is_checkout()
        is_ready = get_state(self.context) == 'ready_for_checkin'
        can_checkin = bool(set(['Editor', 'Reviewer']).
                           intersection(set(local_roles)))

        return is_wc and is_ready and can_checkin

    def render(self):
        if self.available:
            return super(CountryCheckoutViewlet, self).render()
        return ''

    @property
    def available(self):
        return not is_anonymous()

    # def can_edit(self):
    #     return self.current_state() != 'published'
    # def can_submit_for_publication(self):
    #     # TODO: return True if transition submit is available
    #     return self.current_state() in ['private', 'sent']

    # def current_state(self):
    #     return get_state(self.context)
    #
    # def get_working_copy(self):
    #
    #     context = self.context
    #     policy = ICheckinCheckoutPolicy(context, None)
    #
    #     if policy is None:
    #         return False
    #
    #     wc = policy.getWorkingCopy()
    #     return wc
    #
    # def has_working_copy(self):
    #     wc = self.get_working_copy()
    #     if wc is not None:
    #         return True
    #     return False
    #
    # def get_baseline_state(self):
    #     policy = ICheckinCheckoutPolicy(self.context)
    #     baseline = policy.getBaseline()
    #     if baseline is None:
    #         baseline = self.context
    #
    #     return get_state(baseline)
