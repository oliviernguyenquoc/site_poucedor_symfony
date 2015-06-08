<?php

namespace Pouce\UserBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * UserRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class UserRepository extends EntityRepository
{
	// To get all the free, who do not have a team, contesters in the school (id)
	// Warning : Not tested
	public function getAllUSersInSchool($idSchool,$userYear)
	{
		$qb = $this	-> createQueryBuilder('u')
                    -> where('YEAR(u.last_login) = :userYear')
                     ->setParameter('userYear', $userYear)
                    -> join('u.school','s')
                    -> where('s.id = :idSchool')
                     ->setParameter('idSchool', $idSchool)
                    -> leftjoin('u.teams', 't')
                    -> join('t.edition','e')
                    -> where('e.year != :userYear2')
                     ->setParameter('userYear2', $userYear) //Need to be modified
                    ;
		return $qb ;					
	}
}
